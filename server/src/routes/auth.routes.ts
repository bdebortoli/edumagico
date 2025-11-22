import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { UserAccess } from '../entities/UserAccess';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, cpf, birthDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if email already exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Check if CPF already exists (if provided)
    if (cpf) {
      const existingCpf = await userRepository.findOne({ where: { cpf } });
      if (existingCpf) {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'parent',
      cpf,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      plan: 'basic',
      coins: 0
    });

    await userRepository.save(user);

    // Remove password from response
    const { password: _, ...userResponse } = user;

    const token = generateToken(user.id);

    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { email }
      // Removido relations para evitar erro se as tabelas não existirem
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Check for concurrent access (simplified - in production use Redis/DB sessions)
    // For now, we'll allow multiple sessions but could add device tracking here

    const token = generateToken(user.id);

    // Registrar acesso (tenta salvar, mas não falha o login se der erro)
    try {
      const accessRepository = AppDataSource.getRepository(UserAccess);
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const deviceId = req.headers['x-device-id'] as string;

      const access = accessRepository.create({
        userId: user.id,
        loginAt: new Date(),
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent,
        deviceId,
        sessionDuration: 0
      });

      await accessRepository.save(access);
    } catch (accessError) {
      // Log do erro mas não falha o login
      console.error('Erro ao registrar acesso:', accessError);
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      user: userResponse,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMessage = error.message || 'Erro interno do servidor';
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
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
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

export default router;

