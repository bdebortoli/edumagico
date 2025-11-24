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

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11 (Janeiro = 0)
    // Considera que o ano letivo começa em fevereiro (mês 1)
    const schoolYearStartMonth = 1; // Fevereiro

    // Garante que a idade está calculada, educationLevel está definido e formata birthDate para ISO string
    const childrenWithAge = await Promise.all(children.map(async (child) => {
      // Se educationLevel não estiver definido, calcula baseado na série
      if (!child.educationLevel && child.grade) {
        child.educationLevel = getEducationLevel(child.grade);
        await childRepository.save(child);
      }

      // Atualização automática de série ao mudar de ano
      // Verifica se passou um ano desde a última atualização (baseado em updatedAt)
      if (child.birthDate && child.updatedAt) {
        const lastUpdate = new Date(child.updatedAt);
        const monthsSinceUpdate = (currentYear - lastUpdate.getFullYear()) * 12 + (currentMonth - lastUpdate.getMonth());
        
        // Se passou mais de 10 meses desde a última atualização, atualiza incrementalmente
        // Isso garante que a série seja atualizada uma vez por ano, de forma incremental
        if (monthsSinceUpdate >= 10) {
          const nextGrade = getNextGrade(child.grade);
          // Só atualiza se não for a última série possível
          if (nextGrade !== child.grade) {
            child.grade = nextGrade;
            child.educationLevel = getEducationLevel(nextGrade);
            await childRepository.save(child);
          }
        }
      }
      
      return {
        ...child,
        birthDate: child.birthDate ? child.birthDate.toISOString().split('T')[0] : null,
        age: child.birthDate ? calculateAge(child.birthDate) : child.age
      };
    }));

    res.json({ children: childrenWithAge });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Erro ao buscar filhos' });
  }
});

// Helper function to calculate age from birth date
function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Helper function to get next grade incrementally
function getNextGrade(currentGrade: string): string {
  const gradeMap: { [key: string]: string } = {
    'Pré-escola': '1º Ano Fund.',
    '1º Ano Fund.': '2º Ano Fund.',
    '2º Ano Fund.': '3º Ano Fund.',
    '3º Ano Fund.': '4º Ano Fund.',
    '4º Ano Fund.': '5º Ano Fund.',
    '5º Ano Fund.': '6º Ano Fund.',
    '6º Ano Fund.': '7º Ano Fund.',
    '7º Ano Fund.': '8º Ano Fund.',
    '8º Ano Fund.': '9º Ano Fund.',
    '9º Ano Fund.': '1º Ano Médio',
    '1º Ano Médio': '2º Ano Médio',
    '2º Ano Médio': '3º Ano Médio',
    '3º Ano Médio': '3º Ano Médio' // Mantém no último ano
  };
  
  return gradeMap[currentGrade] || currentGrade;
}

// Helper function to categorize education level based on grade
function getEducationLevel(grade: string): 'pre-escola' | 'fundamental1' | 'fundamental2' | 'ensino-medio' | undefined {
  if (!grade) return undefined;
  
  const gradeLower = grade.toLowerCase();
  
  // Pré-escola
  if (gradeLower.includes('pré-escola') || gradeLower.includes('pre-escola')) {
    return 'pre-escola';
  }
  
  // Fundamental 1 (1º a 5º Ano Fund.)
  if (gradeLower.includes('1º ano fund') || 
      gradeLower.includes('2º ano fund') || 
      gradeLower.includes('3º ano fund') || 
      gradeLower.includes('4º ano fund') || 
      gradeLower.includes('5º ano fund')) {
    return 'fundamental1';
  }
  
  // Fundamental 2 (6º a 9º Ano Fund.)
  if (gradeLower.includes('6º ano fund') || 
      gradeLower.includes('7º ano fund') || 
      gradeLower.includes('8º ano fund') || 
      gradeLower.includes('9º ano fund')) {
    return 'fundamental2';
  }
  
  // Ensino Médio (1º a 3º Ano Médio)
  if (gradeLower.includes('1º ano médio') || 
      gradeLower.includes('2º ano médio') || 
      gradeLower.includes('3º ano médio')) {
    return 'ensino-medio';
  }
  
  return undefined;
}

// Create child
router.post('/children', async (req: AuthRequest, res: Response) => {
  try {
    const { name, birthDate, age, grade, school, state, city, avatar } = req.body;

    if (!name || !birthDate || !grade) {
      return res.status(400).json({ error: 'Nome, data de nascimento e série são obrigatórios' });
    }

    // Calcula a idade a partir da data de nascimento
    const calculatedAge = calculateAge(birthDate);

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
      birthDate: new Date(birthDate),
      age: calculatedAge, // Calculado para compatibilidade
      grade,
      educationLevel: getEducationLevel(grade), // Categorização automática baseada na série
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
    const { name, birthDate, grade, school, state, city, avatar } = req.body;

    const childRepository = AppDataSource.getRepository(ChildProfile);
    const child = await childRepository.findOne({
      where: { id: req.params.id, parentId: req.user!.id }
    });

    if (!child) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    if (name) child.name = name;
    if (birthDate) {
      child.birthDate = new Date(birthDate);
      child.age = calculateAge(birthDate); // Recalcula a idade
    }
    if (grade) {
      child.grade = grade;
      child.educationLevel = getEducationLevel(grade); // Recalcula a categorização quando a série muda
    }
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

