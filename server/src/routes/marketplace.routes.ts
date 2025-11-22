import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ContentItem } from '../entities/ContentItem';
import { Purchase } from '../entities/Purchase';
import { User } from '../entities/User';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get marketplace content (paid content from teachers)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { subject, grade, teacher } = req.query;

    const contentRepository = AppDataSource.getRepository(ContentItem);
    let query = contentRepository.createQueryBuilder('content')
      .where('content.price > 0')
      .andWhere('content.authorId != :userId', { userId: req.user!.id });

    if (subject && subject !== 'Todos') {
      query = query.andWhere('content.subject = :subject', { subject });
    }

    if (grade && grade !== 'Todos') {
      query = query.andWhere('content.grade = :grade', { grade });
    }

    if (teacher) {
      query = query.andWhere('LOWER(content.authorName) LIKE LOWER(:teacher)', {
        teacher: `%${teacher}%`
      });
    }

    const content = await query
      .orderBy('content.salesCount', 'DESC')
      .addOrderBy('content.createdAt', 'DESC')
      .getMany();

    res.json({ content });
  } catch (error) {
    console.error('Get marketplace error:', error);
    res.status(500).json({ error: 'Erro ao buscar marketplace' });
  }
});

// Get marketplace content by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const content = await contentRepository.findOne({
      where: { id: req.params.id },
      relations: ['author']
    });

    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    if (content.price === 0) {
      return res.status(400).json({ error: 'Este conteúdo não está disponível no marketplace' });
    }

    // Check if already purchased
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    const purchase = await purchaseRepository.findOne({
      where: {
        userId: req.user!.id,
        contentId: content.id,
        status: 'completed'
      }
    });

    res.json({
      content,
      purchased: !!purchase
    });
  } catch (error) {
    console.error('Get marketplace item error:', error);
    res.status(500).json({ error: 'Erro ao buscar item do marketplace' });
  }
});

// Purchase content
router.post('/:id/purchase', async (req: AuthRequest, res: Response) => {
  try {
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const purchaseRepository = AppDataSource.getRepository(Purchase);
    const userRepository = AppDataSource.getRepository(User);

    // Valida se o ID é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'ID do conteúdo inválido. Deve ser um UUID.' });
    }

    const content = await contentRepository.findOne({
      where: { id: req.params.id }
    });

    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    if (content.price === 0) {
      return res.status(400).json({ error: 'Este conteúdo é gratuito' });
    }

    if (content.authorId === req.user!.id) {
      return res.status(400).json({ error: 'Você não pode comprar seu próprio conteúdo' });
    }

    // Check if already purchased
    const existingPurchase = await purchaseRepository.findOne({
      where: {
        userId: req.user!.id,
        contentId: content.id,
        status: 'completed'
      }
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'Você já possui este conteúdo' });
    }

    // Check user coins
    const user = await userRepository.findOne({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.coins < content.price) {
      return res.status(400).json({ error: 'Moedas insuficientes' });
    }

    // Create purchase
    const purchase = purchaseRepository.create({
      userId: req.user!.id,
      contentId: content.id,
      price: content.price,
      coinsUsed: content.price,
      status: 'completed'
    });

    await purchaseRepository.save(purchase);

    // Deduct coins
    user.coins -= content.price;
    await userRepository.save(user);

    // Increment sales count
    content.salesCount += 1;
    await contentRepository.save(content);

    // Create a copy for user's library (with price 0)
    const purchasedContent = contentRepository.create({
      ...content,
      id: undefined, // New ID
      price: 0,
      authorId: req.user!.id,
      salesCount: 0
    });

    await contentRepository.save(purchasedContent);

    res.json({
      message: 'Compra realizada com sucesso',
      purchase,
      content: purchasedContent
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Erro ao realizar compra' });
  }
});

export default router;

