import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Route } from '../entities/Route';
import { RoutePermission } from '../entities/RoutePermission';
import { AuthRequest } from './auth.middleware';

export const checkRoutePermission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const routeRepository = AppDataSource.getRepository(Route);
    const permissionRepository = AppDataSource.getRepository(RoutePermission);

    // Normalize path (remove query params, handle :id patterns)
    const normalizedPath = req.path.split('?')[0];
    
    // Try to find exact match first
    let route = await routeRepository.findOne({
      where: {
        path: normalizedPath,
        method: req.method
      }
    });

    // If not found, try to match with pattern (replace :id with %)
    if (!route) {
      const patternPath = normalizedPath.replace(/\/[^/]+$/, '/:id');
      route = await routeRepository.findOne({
        where: {
          path: patternPath,
          method: req.method
        }
      });
    }

    if (!route) {
      // If route not registered, allow by default (for development)
      // In production, you might want to deny by default
      return next();
    }

    // Check permission for user role
    const permission = await permissionRepository.findOne({
      where: {
        rotaId: route.id,
        role: req.user.role as 'parent' | 'teacher' | 'admin'
      }
    });

    if (!permission || !permission.allowed) {
      return res.status(403).json({ 
        error: 'Acesso negado para esta rota',
        route: normalizedPath,
        method: req.method
      });
    }

    next();
  } catch (error) {
    console.error('Error checking route permission:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
};

