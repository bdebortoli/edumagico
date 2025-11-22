import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { UserAccess } from '../entities/UserAccess';
import { AuthRequest } from './auth.middleware';

// Armazena sessões ativas em memória (em produção, usar Redis)
const activeSessions = new Map<string, { accessId: string; loginAt: Date }>();

export const trackAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const deviceId = req.headers['x-device-id'] as string;

    // Verifica se já existe uma sessão ativa
    let session = activeSessions.get(userId);

    if (!session) {
      // Cria novo registro de acesso
      const accessRepository = AppDataSource.getRepository(UserAccess);
      const access = accessRepository.create({
        userId,
        loginAt: new Date(),
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent,
        deviceId,
        sessionDuration: 0
      });

      const savedAccess = await accessRepository.save(access);
      activeSessions.set(userId, { accessId: savedAccess.id, loginAt: savedAccess.loginAt });
    }

    // Atualiza o tempo de sessão periodicamente (a cada 30 segundos)
    const lastUpdate = (req as any).lastAccessUpdate || 0;
    const now = Date.now();
    
    if (now - lastUpdate > 30000) { // 30 segundos
      if (session) {
        const accessRepository = AppDataSource.getRepository(UserAccess);
        const access = await accessRepository.findOne({ where: { id: session.accessId } });
        
        if (access) {
          const duration = Math.floor((now - session.loginAt.getTime()) / 1000);
          access.sessionDuration = duration;
          await accessRepository.save(access);
        }
      }
      (req as any).lastAccessUpdate = now;
    }

    next();
  } catch (error) {
    console.error('Error tracking access:', error);
    next(); // Continua mesmo se houver erro no tracking
  }
};

export const trackLogout = async (userId: string) => {
  try {
    const session = activeSessions.get(userId);
    if (session) {
      const accessRepository = AppDataSource.getRepository(UserAccess);
      const access = await accessRepository.findOne({ where: { id: session.accessId } });
      
      if (access) {
        access.logoutAt = new Date();
        const duration = Math.floor((access.logoutAt.getTime() - session.loginAt.getTime()) / 1000);
        access.sessionDuration = duration;
        await accessRepository.save(access);
      }
      
      activeSessions.delete(userId);
    }
  } catch (error) {
    console.error('Error tracking logout:', error);
  }
};

