import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ChildProfile } from '../entities/ChildProfile';
import { User } from '../entities/User';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and parent role
router.use(authenticate);
router.use(requireRole(['parent']));

// Get children
router.get('/children', async (req: AuthRequest, res: Response) => {
  try {
    const childRepository = AppDataSource.getRepository(ChildProfile);
    const children = await childRepository.find({
      where: { parentId: req.user!.id },
      order: { createdAt: 'DESC' }
    });

    res.json({ children });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Erro ao buscar filhos' });
  }
});

// Create child
router.post('/children', async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, grade, school, state, city, avatar } = req.body;

    if (!name || !age || !grade) {
      return res.status(400).json({ error: 'Nome, idade e série são obrigatórios' });
    }

    // Check plan limits
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: req.user!.id },
      relations: ['children']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const maxChildren = user.plan === 'premium' ? 4 : 1;
    const currentCount = user.children?.length || 0;

    if (currentCount >= maxChildren) {
      return res.status(403).json({
        error: `Limite de perfis atingido. Plano ${user.plan} permite ${maxChildren} perfil(is)`,
        maxChildren
      });
    }

    const childRepository = AppDataSource.getRepository(ChildProfile);
    const child = childRepository.create({
      name,
      age,
      grade,
      school,
      state,
      city,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      parentId: req.user!.id,
      points: 0
    });

    await childRepository.save(child);

    res.status(201).json({ child });
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({ error: 'Erro ao criar perfil de filho' });
  }
});

// Update child
router.put('/children/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, grade, school, state, city, avatar } = req.body;

    const childRepository = AppDataSource.getRepository(ChildProfile);
    const child = await childRepository.findOne({
      where: { id: req.params.id, parentId: req.user!.id }
    });

    if (!child) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    if (name) child.name = name;
    if (age) child.age = age;
    if (grade) child.grade = grade;
    if (school !== undefined) child.school = school;
    if (state !== undefined) child.state = state;
    if (city !== undefined) child.city = city;
    if (avatar) child.avatar = avatar;

    await childRepository.save(child);

    res.json({ child });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Delete child
router.delete('/children/:id', async (req: AuthRequest, res: Response) => {
  try {
    const childRepository = AppDataSource.getRepository(ChildProfile);
    const child = await childRepository.findOne({
      where: { id: req.params.id, parentId: req.user!.id }
    });

    if (!child) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    await childRepository.remove(child);

    res.json({ message: 'Perfil removido com sucesso' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Erro ao remover perfil' });
  }
});

export default router;

