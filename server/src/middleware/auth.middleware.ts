import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth] Request path:', req.path);
    console.log('[Auth] Authorization header exists:', !!authHeader);
    
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('[Auth] No token provided');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    console.log('[Auth] JWT_SECRET defined:', !!process.env.JWT_SECRET);
    console.log('[Auth] Token length:', token.length);
    console.log('[Auth] Token preview:', token.substring(0, 30) + '...');
    
    const decoded = jwt.verify(token, secret) as { userId: string };
    console.log('[Auth] Token decoded, userId:', decoded.userId);
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      relations: ['children'] // subscription é um campo JSONB, não uma relação
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('[Auth] Token validation error:', error.message);
    console.error('[Auth] Token received:', req.headers.authorization?.substring(0, 50) + '...');
    console.error('[Auth] JWT_SECRET:', process.env.JWT_SECRET ? 'Defined' : 'Not defined (using default)');
    return res.status(401).json({ error: 'Token inválido', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const requireRole = (roles: ('parent' | 'teacher' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role as any) && !roles.includes('admin')) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    next();
  };
};

