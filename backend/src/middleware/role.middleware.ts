import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';

type Role = 'admin' | 'secretaria' | 'professor' | 'estudante';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware específico para verificar se o usuário está acessando seus próprios dados
export const authorizeOwnerOrRoles = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verifica se tem permissão pelo role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Ou se está acessando seus próprios dados
    const resourceId = req.params.id || req.params.studentId;
    if (resourceId && resourceId === req.user.userId) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied' });
  };
};
