import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Invoice } from '../entities/Invoice';
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
    const { plan, cycle, paymentMethod } = req.body;

    if (!plan || !cycle) {
      return res.status(400).json({ error: 'Plano e ciclo são obrigatórios' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const invoiceRepository = AppDataSource.getRepository(Invoice);
    
    const user = await userRepository.findOne({ where: { id: req.user!.id } });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Só cria invoice se estiver fazendo upgrade para premium
    const isUpgrade = user.plan !== 'premium' && plan === 'premium';

    // Calcula o valor da assinatura
    const monthlyPrice = 29.90;
    const yearlyPrice = 23.90;
    const amount = cycle === 'monthly' ? monthlyPrice : yearlyPrice * 12;

    // Atualiza o plano e subscription
    user.plan = plan;
    const nextBillingDate = new Date();
    if (cycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    user.subscription = {
      status: 'active',
      cycle: cycle,
      nextBillingDate: nextBillingDate,
      last4Digits: paymentMethod?.last4 || '4242' // Mock ou último 4 dígitos do cartão
    };

    await userRepository.save(user);

    // Cria invoice se for upgrade para premium
    if (isUpgrade) {
      const invoice = new Invoice();
      invoice.userId = user.id;
      invoice.amount = amount;
      invoice.type = 'subscription';
      invoice.paymentMethod = paymentMethod?.type || 'credit_card';
      invoice.dueDate = new Date(); // Data de vencimento = hoje (já pago)
      invoice.paidAt = new Date(); // Já foi pago
      invoice.status = 'paid';
      invoice.description = `Assinatura Premium ${cycle === 'monthly' ? 'Mensal' : 'Anual'}`;
      invoice.metadata = {
        subscriptionId: user.id,
        cycle: cycle,
        plan: plan
      };

      await invoiceRepository.save(invoice);
    }

    const { password: _, ...userResponse } = user;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Erro ao atualizar assinatura' });
  }
});

export default router;

