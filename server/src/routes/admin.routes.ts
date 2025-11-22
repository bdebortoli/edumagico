import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { ContentItem } from '../entities/ContentItem';
import { ChildProfile } from '../entities/ChildProfile';
import { UserAccess } from '../entities/UserAccess';
import { Notification } from '../entities/Notification';
import { FinancialTransaction } from '../entities/FinancialTransaction';
import { TeacherRating } from '../entities/TeacherRating';
import { Invoice } from '../entities/Invoice';
import { Purchase } from '../entities/Purchase';
import { ActivityHistory } from '../entities/ActivityHistory';
import { Route } from '../entities/Route';
import { RoutePermission } from '../entities/RoutePermission';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';

const router = Router();

// Todas as rotas requerem autenticação e role admin
router.use(authenticate);
router.use(requireRole(['admin']));

// ========== DASHBOARD E ESTATÍSTICAS ==========
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const accessRepository = AppDataSource.getRepository(UserAccess);
    const transactionRepository = AppDataSource.getRepository(FinancialTransaction);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

    const [
      totalUsers,
      totalParents,
      totalTeachers,
      totalStudents,
      totalContent,
      totalAccesses,
      totalRevenue,
      monthlyRevenue,
      activeUsers,
      newUsersThisMonth,
      totalSubscriptions,
      activeSubscriptions
    ] = await Promise.all([
      userRepository.count(),
      userRepository.count({ where: { role: 'parent' } }),
      userRepository.count({ where: { role: 'teacher' } }),
      AppDataSource.getRepository(ChildProfile).count(),
      contentRepository.count(),
      accessRepository.count(),
      transactionRepository
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .where('t.type = :type', { type: 'income' })
        .andWhere('t.status = :status', { status: 'completed' })
        .getRawOne(),
      transactionRepository
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .where('t.type = :type', { type: 'income' })
        .andWhere('t.status = :status', { status: 'completed' })
        .andWhere('t.createdAt >= :start', { start: monthStart })
        .getRawOne(),
      accessRepository
        .createQueryBuilder('a')
        .select('COUNT(DISTINCT a.userId)', 'count')
        .where('a.loginAt >= :start', { start: monthStart })
        .getRawOne(),
      userRepository
        .createQueryBuilder('u')
        .where('u.createdAt >= :start', { start: monthStart })
        .getCount(),
      userRepository
        .createQueryBuilder('u')
        .where("u.subscription IS NOT NULL")
        .getCount(),
      userRepository
        .createQueryBuilder('u')
        .where("u.subscription->>'status' = 'active'")
        .getCount()
    ]);

    res.json({
      stats: {
        totalUsers,
        totalParents,
        totalTeachers,
        totalStudents,
        totalContent,
        totalAccesses,
        totalRevenue: parseFloat(totalRevenue?.total || '0'),
        monthlyRevenue: parseFloat(monthlyRevenue?.total || '0'),
        activeUsers: parseInt(activeUsers?.count || '0'),
        newUsersThisMonth: newUsersThisMonth || 0,
        totalSubscriptions: totalSubscriptions || 0,
        activeSubscriptions: activeSubscriptions || 0
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ========== GERENCIAMENTO DE USUÁRIOS ==========
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;
    const userRepository = AppDataSource.getRepository(User);
    
    // Mostrar apenas admin, professores e responsáveis (não alunos)
    const query = userRepository.createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: ['admin', 'teacher', 'parent'] })
      .leftJoinAndSelect('user.children', 'children');

    if (role && ['admin', 'teacher', 'parent'].includes(role as string)) {
      query.andWhere('user.role = :role', { role });
    }

    if (search) {
      query.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [users, total] = await query
      .skip(skip)
      .take(parseInt(limit as string))
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    console.log(`[Admin] GET /users - Found ${users.length} users (total: ${total})`);
    
    // Remove password from response
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.json({ 
      users: usersWithoutPassword, 
      total, 
      page: parseInt(page as string), 
      limit: parseInt(limit as string) 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const accessRepository = AppDataSource.getRepository(UserAccess);
    const transactionRepository = AppDataSource.getRepository(FinancialTransaction);
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    const ratingRepository = AppDataSource.getRepository(TeacherRating);
    
    const user = await userRepository.findOne({
      where: { id },
      relations: ['children', 'contents', 'purchases', 'activityHistory', 'invoices']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar acessos do usuário
    const accesses = await accessRepository.find({
      where: { userId: id },
      order: { loginAt: 'DESC' },
      take: 1 // Último acesso
    });

    // Calcular tempo total na plataforma
    const totalTime = await accessRepository
      .createQueryBuilder('access')
      .select('SUM(access.sessionDuration)', 'total')
      .where('access.userId = :userId', { userId: id })
      .getRawOne();

    const lastAccess = accesses[0];
    const totalTimeOnPlatform = parseInt(totalTime?.total || '0');

    // Preparar resposta baseada no role
    const response: any = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      totalTimeOnPlatform,
      lastAccess: lastAccess ? {
        loginAt: lastAccess.loginAt,
        logoutAt: lastAccess.logoutAt,
        sessionDuration: lastAccess.sessionDuration
      } : null
    };

    // Para ADMIN: apenas nome, email e telefone
    if (user.role === 'admin') {
      return res.json(response);
    }

    // Para PARENT: todos os dados (exceto cartão), alunos, plano, faturas, total pago
    if (user.role === 'parent') {
      // Buscar todas as faturas
      const invoices = await invoiceRepository.find({
        where: { userId: id },
        order: { dueDate: 'DESC' }
      });

      // Calcular total pago (apenas faturas pagas)
      const totalPaid = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);

      // Buscar transações financeiras relacionadas
      const transactions = await transactionRepository.find({
        where: { userId: id, category: 'subscription' },
        order: { createdAt: 'DESC' }
      });

      response.user = {
        ...response.user,
        cpf: user.cpf,
        birthDate: user.birthDate,
        address: user.address,
        plan: user.plan,
        subscription: user.subscription,
        coins: user.coins,
        children: user.children || [],
        // Não incluir parentProfile.paymentMethods (dados do cartão)
        parentProfile: user.parentProfile ? {
          ...user.parentProfile,
          paymentMethods: undefined // Remover dados do cartão
        } : null
      };

      response.invoices = invoices.map(inv => ({
        id: inv.id,
        amount: parseFloat(inv.amount.toString()),
        type: inv.type,
        paymentMethod: inv.paymentMethod,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        status: inv.status,
        description: inv.description,
        createdAt: inv.createdAt
      }));

      response.totalPaid = totalPaid;
      response.currentPlan = user.plan;
      response.subscriptionStatus = user.subscription?.status || 'inactive';

      return res.json(response);
    }

    // Para TEACHER: todos os dados, tempo de uso, materiais, vendas, total recebido, avaliação
    if (user.role === 'teacher') {
      // Contar materiais criados
      const contentsCount = await contentRepository.count({
        where: { authorId: id }
      });

      // Buscar todos os materiais
      const contents = await contentRepository.find({
        where: { authorId: id },
        order: { createdAt: 'DESC' }
      });

      // Buscar todas as vendas dos materiais do professor
      const contentIds = contents.map(c => c.id);
      const sales = contentIds.length > 0 ? await purchaseRepository.find({
        where: { contentId: In(contentIds) },
        relations: ['content'],
        order: { createdAt: 'DESC' }
      }) : [];

      // Calcular total recebido (vendas dos materiais)
      const totalEarnings = sales.reduce((sum, sale) => {
        return sum + parseFloat(sale.price.toString());
      }, 0);

      // Buscar avaliações do professor
      const ratings = await ratingRepository.find({
        where: { teacherId: id }
      });

      // Calcular avaliação geral (média das avaliações)
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      // Buscar faturas de vendas (transações de income com category content_sale)
      const salesTransactions = await transactionRepository.find({
        where: {
          userId: id,
          type: 'income',
          category: 'content_sale'
        },
        order: { createdAt: 'DESC' }
      });

      response.user = {
        ...response.user,
        cpf: user.cpf,
        birthDate: user.birthDate,
        address: user.address,
        teacherProfile: user.teacherProfile,
        coins: user.coins
      };

      response.contentsCount = contentsCount;
      response.totalEarnings = totalEarnings;
      response.averageRating = Math.round(averageRating * 10) / 10; // Arredondar para 1 casa decimal
      response.salesCount = sales.length;
      response.salesInvoices = salesTransactions.map(t => ({
        id: t.id,
        amount: parseFloat(t.amount.toString()),
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        metadata: t.metadata
      }));

      return res.json(response);
    }

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, plan, ...updates } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (plan) user.plan = plan;
    Object.assign(user, updates);

    await userRepository.save(user);
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    
    await userRepository.delete(id);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// ========== GERENCIAMENTO DE CONTEÚDOS ==========
router.get('/content', async (req: Request, res: Response) => {
  try {
    const { type, authorId, search, page = '1', limit = '20' } = req.query;
    const contentRepository = AppDataSource.getRepository(ContentItem);
    
    const query = contentRepository.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author');

    if (type) {
      query.where('content.type = :type', { type });
    }

    if (authorId) {
      query.andWhere('content.authorId = :authorId', { authorId });
    }

    if (search) {
      query.andWhere(
        '(content.title ILIKE :search OR content.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [contents, total] = await query
      .skip(skip)
      .take(parseInt(limit as string))
      .orderBy('content.createdAt', 'DESC')
      .getManyAndCount();

    res.json({ contents, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Erro ao buscar conteúdos' });
  }
});

router.delete('/content/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contentRepository = AppDataSource.getRepository(ContentItem);
    
    await contentRepository.delete(id);
    res.json({ message: 'Conteúdo deletado com sucesso' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Erro ao deletar conteúdo' });
  }
});

// ========== GERENCIAMENTO DE ASSINATURAS ==========
router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const userRepository = AppDataSource.getRepository(User);
    
    const query = userRepository.createQueryBuilder('user')
      .where('user.subscription IS NOT NULL');

    if (status) {
      query.andWhere("user.subscription->>'status' = :status", { status });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [users, total] = await query
      .skip(skip)
      .take(parseInt(limit as string))
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    res.json({ subscriptions: users, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Erro ao buscar assinaturas' });
  }
});

router.put('/subscriptions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, cycle, nextBillingDate } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!user.subscription) {
      user.subscription = {
        status: 'active',
        cycle: 'monthly',
        nextBillingDate: new Date()
      };
    }

    if (status) user.subscription.status = status;
    if (cycle) user.subscription.cycle = cycle;
    if (nextBillingDate) user.subscription.nextBillingDate = new Date(nextBillingDate);

    await userRepository.save(user);
    res.json(user);
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Erro ao atualizar assinatura' });
  }
});

// ========== NOTIFICAÇÕES E COMUNICAÇÕES ==========
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const { targetType, userId, title, message, type = 'info', metadata } = req.body;
    const notificationRepository = AppDataSource.getRepository(Notification);
    const userRepository = AppDataSource.getRepository(User);
    const authReq = req as AuthRequest;

    let users: User[] = [];

    if (targetType === 'all') {
      users = await userRepository.find();
    } else if (targetType === 'parent') {
      users = await userRepository.find({ where: { role: 'parent' } });
    } else if (targetType === 'teacher') {
      users = await userRepository.find({ where: { role: 'teacher' } });
    } else if (targetType === 'specific' && userId) {
      const user = await userRepository.findOne({ where: { id: userId } });
      if (user) users = [user];
    }

    const notifications = users.map(user => 
      notificationRepository.create({
        userId: user.id,
        targetType,
        title,
        message,
        type,
        isRead: false
      })
    );

    await notificationRepository.save(notifications);
    res.json({ message: `${notifications.length} notificações criadas`, notifications });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Erro ao criar notificações' });
  }
});

router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { userId, isRead, page = '1', limit = '20' } = req.query;
    const notificationRepository = AppDataSource.getRepository(Notification);
    
    const query = notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user');

    if (userId) {
      query.where('notification.userId = :userId', { userId });
    }

    if (isRead !== undefined) {
      query.andWhere('notification.isRead = :isRead', { isRead: isRead === 'true' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [notifications, total] = await query
      .skip(skip)
      .take(parseInt(limit as string))
      .orderBy('notification.createdAt', 'DESC')
      .getManyAndCount();

    res.json({ notifications, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// ========== FINANCEIRO ==========
router.get('/financial/transactions', async (req: Request, res: Response) => {
  try {
    const { type, category, status, startDate, endDate, page = '1', limit = '20' } = req.query;
    const transactionRepository = AppDataSource.getRepository(FinancialTransaction);
    
    const query = transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.user', 'user');

    if (type) {
      query.where('transaction.type = :type', { type });
    }

    if (status) {
      query.andWhere('transaction.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [transactions, total] = await query
      .skip(skip)
      .take(parseInt(limit as string))
      .orderBy('transaction.createdAt', 'DESC')
      .getManyAndCount();

    res.json({ transactions, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

router.get('/financial/reports/monthly', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const transactionRepository = AppDataSource.getRepository(FinancialTransaction);
    
    const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const [income, expenses] = await Promise.all([
      transactionRepository
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .addSelect('COUNT(t.id)', 'count')
        .where('t.type = :type', { type: 'income' })
        .andWhere('t.status = :status', { status: 'completed' })
        .andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne(),
      transactionRepository
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .addSelect('COUNT(t.id)', 'count')
        .where('t.type = :type', { type: 'expense' })
        .andWhere('t.status = :status', { status: 'completed' })
        .andWhere('t.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne()
    ]);

    const revenue = parseFloat(income?.total || '0');
    const expensesTotal = parseFloat(expenses?.total || '0');
    const profit = revenue - expensesTotal;

    res.json({
      month: targetMonth,
      year: targetYear,
      revenue,
      expenses: expensesTotal,
      profit,
      incomeCount: parseInt(income?.count || '0'),
      expenseCount: parseInt(expenses?.count || '0')
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório mensal' });
  }
});

router.get('/financial/reports/dre', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const transactionRepository = AppDataSource.getRepository(FinancialTransaction);
    
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const [revenue, expenses, byCategory] = await Promise.all([
      transactionRepository
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .where('t.type = :type', { type: 'income' })
        .andWhere('t.status = :status', { status: 'completed' })
        .andWhere('t.createdAt BETWEEN :start AND :end', { start, end })
        .getRawOne(),
      transactionRepository
        .createQueryBuilder('t')
        .select('SUM(t.amount)', 'total')
        .where('t.type = :type', { type: 'expense' })
        .andWhere('t.status = :status', { status: 'completed' })
        .andWhere('t.createdAt BETWEEN :start AND :end', { start, end })
        .getRawOne(),
      transactionRepository
        .createQueryBuilder('t')
        .select('t.category', 'category')
        .addSelect('t.type', 'type')
        .addSelect('SUM(t.amount)', 'total')
        .where('t.status = :status', { status: 'completed' })
        .andWhere('t.createdAt BETWEEN :start AND :end', { start, end })
        .groupBy('t.category')
        .addGroupBy('t.type')
        .getRawMany()
    ]);

    res.json({
      period: { start, end },
      revenue: parseFloat(revenue?.total || '0'),
      expenses: parseFloat(expenses?.total || '0'),
      profit: parseFloat(revenue?.total || '0') - parseFloat(expenses?.total || '0'),
      byCategory
    });
  } catch (error) {
    console.error('DRE report error:', error);
    res.status(500).json({ error: 'Erro ao gerar DRE' });
  }
});

// ========== RANKINGS ==========
router.get('/rankings/teachers', async (req: Request, res: Response) => {
  try {
    const { sortBy = 'revenue' } = req.query;
    const userRepository = AppDataSource.getRepository(User);
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const ratingRepository = AppDataSource.getRepository(TeacherRating);
    const transactionRepository = AppDataSource.getRepository(FinancialTransaction);

    const teachers = await userRepository.find({
      where: { role: 'teacher' },
      relations: ['contents']
    });

    const rankings = await Promise.all(
      teachers.map(async (teacher) => {
        const [revenue, contentCount, ratings, purchases] = await Promise.all([
          transactionRepository
            .createQueryBuilder('t')
            .select('SUM(t.amount)', 'total')
            .where('t.type = :type', { type: 'purchase' })
            .andWhere('t.status = :status', { status: 'completed' })
            .andWhere('t.contentItemId IN (SELECT id FROM content_items WHERE author_id = :teacherId)', { teacherId: teacher.id })
            .getRawOne(),
          contentRepository.count({ where: { authorId: teacher.id } }),
          ratingRepository
            .createQueryBuilder('r')
            .select('AVG(r.rating)', 'avg')
            .addSelect('COUNT(r.id)', 'count')
            .where('r.teacherId = :teacherId', { teacherId: teacher.id })
            .getRawOne(),
          (async () => {
            const contentIds = await contentRepository
              .createQueryBuilder('c')
              .select('c.id', 'id')
              .where('c.authorId = :teacherId', { teacherId: teacher.id })
              .getRawMany();
            const ids = contentIds.map(c => c.id);
            return ids.length > 0 ? await AppDataSource.getRepository(Purchase).count({
              where: { contentId: In(ids) }
            }) : 0;
          })()
        ]);

        // Calcula total de vendas
        const teacherContents = await contentRepository.find({ where: { authorId: teacher.id } });
        const totalSales = teacherContents.reduce((sum, content) => sum + (content.salesCount || 0), 0);

        return {
          teacherId: teacher.id,
          teacher: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email
          },
          totalRevenue: parseFloat(revenue?.total || '0'),
          totalMaterials: contentCount,
          averageRating: parseFloat(ratings?.avg || '0'),
          totalRatings: parseInt(ratings?.count || '0'),
          totalSales
        };
      })
    );

    // Ordenar por critério
    if (sortBy === 'revenue') {
      rankings.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else if (sortBy === 'content') {
      rankings.sort((a, b) => b.totalMaterials - a.totalMaterials);
    } else if (sortBy === 'rating') {
      rankings.sort((a, b) => b.averageRating - a.averageRating);
    }

    res.json({ rankings });
  } catch (error) {
    console.error('Get teacher rankings error:', error);
    res.status(500).json({ error: 'Erro ao buscar rankings' });
  }
});

// ========== RELATÓRIOS DE USO ==========
router.get('/reports/usage', async (req: Request, res: Response) => {
  try {
    const { role, startDate, endDate } = req.query;
    const accessRepository = AppDataSource.getRepository(UserAccess);
    const activityRepository = AppDataSource.getRepository(ActivityHistory);
    const userRepository = AppDataSource.getRepository(User);
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Busca usuários baseado no role
    let usersQuery = userRepository.createQueryBuilder('user');
    if (role) {
      usersQuery.where('user.role = :role', { role });
    }
    const users = await usersQuery.getMany();

    // Para cada usuário, calcula estatísticas
    const reports = await Promise.all(
      users.map(async (user) => {
        const userAccesses = await accessRepository.find({
          where: {
            userId: user.id,
            loginAt: Between(start, end)
          },
          order: { loginAt: 'DESC' }
        });

        const userActivities = await activityRepository.find({
          where: {
            userId: user.id,
            completedAt: Between(start, end)
          }
        });

        const totalTimeSpent = userAccesses.reduce((sum, a) => sum + a.sessionDuration, 0);
        const lastAccess = userAccesses.length > 0 ? userAccesses[0].loginAt.toISOString() : user.createdAt;

        return {
          userId: user.id,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          totalAccesses: userAccesses.length,
          totalTimeSpent,
          lastAccess,
          activitiesCompleted: userActivities.length
        };
      })
    );

    res.json({ reports });
  } catch (error) {
    console.error('Usage report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de uso' });
  }
});

// ========== ACESSOS ==========
router.get('/accesses', async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate, page = '1', limit = '20' } = req.query;
    const accessRepository = AppDataSource.getRepository(UserAccess);
    
    const query = accessRepository.createQueryBuilder('access')
      .leftJoinAndSelect('access.user', 'user');

    if (userId) {
      query.where('access.userId = :userId', { userId });
    }

    if (startDate && endDate) {
      query.andWhere('access.loginAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [accesses, total] = await query
      .skip(skip)
      .take(parseInt(limit as string))
      .orderBy('access.loginAt', 'DESC')
      .getManyAndCount();

    res.json({ accesses, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('Get accesses error:', error);
    res.status(500).json({ error: 'Erro ao buscar acessos' });
  }
});

// ========== PERMISSÕES E NÍVEIS DE ACESSO ==========
router.get('/permissions', async (req: Request, res: Response) => {
  try {
    const routeRepository = AppDataSource.getRepository(Route);
    const permissionRepository = AppDataSource.getRepository(RoutePermission);

    const routes = await routeRepository.find({
      order: { path: 'ASC', method: 'ASC' }
    });

    const permissions = await permissionRepository.find();

    res.json({ routes, permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Erro ao buscar permissões' });
  }
});

router.put('/permissions', async (req: Request, res: Response) => {
  try {
    const { routeId, role, allowed } = req.body;

    if (!routeId || !role || typeof allowed !== 'boolean') {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const permissionRepository = AppDataSource.getRepository(RoutePermission);

    let permission = await permissionRepository.findOne({
      where: { rotaId: routeId, role: role as 'parent' | 'teacher' | 'admin' }
    });

    if (permission) {
      permission.allowed = allowed;
      await permissionRepository.save(permission);
    } else {
      permission = permissionRepository.create({
        rotaId: routeId,
        role: role as 'parent' | 'teacher' | 'admin',
        allowed
      });
      await permissionRepository.save(permission);
    }

    res.json({ permission });
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({ error: 'Erro ao atualizar permissão' });
  }
});

export default router;

