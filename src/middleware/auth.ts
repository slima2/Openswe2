import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

export interface JWTPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  department: string;
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError('Access denied. No token provided.', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get fresh user data from database to ensure user is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        ldapSync: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      logger.warn(`Token valid but user not found: ${decoded.username}`);
      throw createError('User not found.', 401);
    }

    if (!user.isActive) {
      logger.warn(`Inactive user attempted access: ${user.username}`);
      throw createError('Account is disabled.', 403);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      ldapSync: user.ldapSync
    };

    // Update last activity timestamp (optional, can be disabled for performance)
    if (process.env.TRACK_USER_ACTIVITY === 'true') {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      }).catch((error: any) => {
        logger.warn('Failed to update user activity timestamp:', error);
      });
    }

    logger.debug(`User ${user.username} authenticated for ${req.method} ${req.path}`);
    next();

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid JWT token for ${req.method} ${req.path}: ${error.message}`);
      return next(createError('Invalid token.', 401));
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn(`Expired JWT token for ${req.method} ${req.path}`);
      return next(createError('Token expired.', 401));
    }

    logger.error(`Authentication error for ${req.method} ${req.path}:`, error);
    next(createError(error.message || 'Authentication failed.', error.statusCode || 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.username} (${req.user.role}) attempted to access ${req.path} without proper role. Required: ${roles.join(', ')}`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    logger.debug(`User ${req.user.username} authorized for ${req.path} with role: ${req.user.role}`);
    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        ldapSync: true
      }
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        ldapSync: user.ldapSync
      };
    }

    next();
  } catch (error: any) {
    // For optional auth, we just continue without user
    next();
  }
};

export const requireSameUserOrRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const targetUserId = req.params.userId || req.body.userId;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'User ID required.',
        code: 'USER_ID_REQUIRED'
      });
    }

    // Allow if same user
    if (req.user.id === targetUserId) {
      return next();
    }

    // Allow if user has required role
    if (roles.includes(req.user.role)) {
      return next();
    }

    logger.warn(`User ${req.user.username} attempted to access another user's data without proper role`);
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  };
};

export const requireDepartmentAccess = (targetDepartment: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin, manager, and finance can access all departments
    if (['admin', 'manager', 'finance'].includes(req.user.role)) {
      return next();
    }

    // Supervisor can access their own department
    if (req.user.role === 'supervisor' && req.user.department === targetDepartment) {
      return next();
    }

    // Regular users can only access their own department
    if (req.user.department === targetDepartment) {
      return next();
    }

    logger.warn(`User ${req.user.username} attempted to access department ${targetDepartment} without permission`);
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions.',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  };
};

export const rateLimitByUser = (maxRequests: number = 100, windowMs: number = 900000) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const userData = userRequests.get(userId);

    if (!userData || now > userData.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userData.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for user: ${req.user.username}`);
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    userData.count++;
    next();
  };
};

export const auditLog = (action: string, entityType: string, entityId?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action,
          entityType,
          entityId,
          details: {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        }
      });
    } catch (error: any) {
      logger.error('Failed to create audit log:', error);
    }

    next();
  };
};
