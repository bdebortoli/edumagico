import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ActivityHistory } from '../entities/ActivityHistory';
import { ContentItem } from '../entities/ContentItem';
import { ChildProfile } from '../entities/ChildProfile';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Record activity completion
router.post('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const { childId, contentId, score, maxScore } = req.body;

    if (!childId || !contentId || score === undefined) {
      return res.status(400).json({ error: 'childId, contentId e score são obrigatórios' });
    }

    const contentRepository = AppDataSource.getRepository(ContentItem);
    const content = await contentRepository.findOne({ where: { id: contentId } });

    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    const historyRepository = AppDataSource.getRepository(ActivityHistory);
    const history = historyRepository.create({
      userId: req.user!.id,
      childId,
      contentId,
      contentTitle: content.title,
      subject: content.subject,
      score,
      maxScore: maxScore || 100
    });

    await historyRepository.save(history);

    // Update child points (simplified - could be calculated from score)
    const pointsEarned = Math.round((score / (maxScore || 100)) * 100);

    // Atualiza os pontos do filho no banco
    const childRepository = AppDataSource.getRepository(ChildProfile);
    const child = await childRepository.findOne({ where: { id: childId } });
    if (child) {
      child.points = (child.points || 0) + pointsEarned;
      await childRepository.save(child);
    }

    res.json({
      history,
      pointsEarned
    });
  } catch (error) {
    console.error('Record activity error:', error);
    res.status(500).json({ error: 'Erro ao registrar atividade' });
  }
});

// Get activity history
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.query;

    const historyRepository = AppDataSource.getRepository(ActivityHistory);
    let query = historyRepository.createQueryBuilder('history')
      .where('history.userId = :userId', { userId: req.user!.id });

    if (childId) {
      query = query.andWhere('history.childId = :childId', { childId });
    }

    const history = await query
      .orderBy('history.completedAt', 'DESC')
      .getMany();

    res.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// Get performance analytics (for parents)
router.get('/performance', requireRole(['parent']), async (req: AuthRequest, res: Response) => {
  try {
    const { childId } = req.query;

    const historyRepository = AppDataSource.getRepository(ActivityHistory);
    let query = historyRepository.createQueryBuilder('history')
      .where('history.userId = :userId', { userId: req.user!.id });

    if (childId) {
      query = query.andWhere('history.childId = :childId', { childId });
    }

    const history = await query.getMany();

    // Calculate statistics
    const totalActivities = history.length;
    const averageScore = history.length > 0
      ? history.reduce((sum, h) => sum + h.score, 0) / history.length
      : 0;

    const bySubject = history.reduce((acc, h) => {
      if (!acc[h.subject]) {
        acc[h.subject] = { count: 0, totalScore: 0 };
      }
      acc[h.subject].count += 1;
      acc[h.subject].totalScore += h.score;
      return acc;
    }, {} as Record<string, { count: number; totalScore: number }>);

    const subjectStats = Object.entries(bySubject).map(([subject, stats]) => ({
      subject,
      count: stats.count,
      averageScore: stats.totalScore / stats.count
    }));

    res.json({
      totalActivities,
      averageScore: Math.round(averageScore),
      subjectStats
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Erro ao buscar desempenho' });
  }
});

// Get teacher financial analytics
router.get('/financial', requireRole(['teacher']), async (req: AuthRequest, res: Response) => {
  try {
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const myContent = await contentRepository.find({
      where: { authorId: req.user!.id },
      order: { salesCount: 'DESC' }
    });

    const totalSalesCount = myContent.reduce((acc, curr) => acc + (curr.salesCount || 0), 0);
    const totalGrossRevenue = myContent.reduce((acc, curr) => acc + (curr.salesCount || 0) * parseFloat(curr.price.toString()), 0);
    const platformFee = totalGrossRevenue * 0.15; // 15% fee
    const netRevenue = totalGrossRevenue - platformFee;

    res.json({
      totalSalesCount,
      totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      content: myContent.map(c => ({
        id: c.id,
        title: c.title,
        price: c.price,
        salesCount: c.salesCount,
        revenue: (c.salesCount || 0) * parseFloat(c.price.toString())
      }))
    });
  } catch (error) {
    console.error('Get financial error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados financeiros' });
  }
});

export default router;

