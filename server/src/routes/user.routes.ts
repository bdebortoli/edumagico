import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user!.id },
      relations: ['children'] // subscription é um campo JSONB, não uma relação
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { password: _, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, phoneNumber, teacherProfile, parentProfile } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (name) user.name = name;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (teacherProfile) user.teacherProfile = teacherProfile;
    if (parentProfile) user.parentProfile = parentProfile;

    await userRepository.save(user);

    const { password: _, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Update subscription
router.put('/subscription', async (req: AuthRequest, res: Response) => {
  try {
    const { plan, cycle } = req.body;

    if (!plan || !cycle) {
      return res.status(400).json({ error: 'Plano e ciclo são obrigatórios' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    user.plan = plan;
    user.subscription = {
      status: 'active',
      cycle: cycle,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      last4Digits: '4242' // Mock
    };

    await userRepository.save(user);

    const { password: _, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Erro ao atualizar assinatura' });
  }
});

export default router;

