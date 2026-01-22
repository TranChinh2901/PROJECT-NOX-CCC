import { Request, Response, NextFunction } from 'express';
import authService from '@/modules/auth/auth.service';
import { AppError } from '@/common/error.response';
import { HttpStatusCode } from '@/constants/status-code';

import { hasPermission, RoleType } from '@/modules/auth/enum/auth.enum';
import { ErrorCode } from '@/constants/error-code';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: RoleType;
  };
  avatar?: Express.Multer.File;
}

export const authMiddleware = (requiredRole?: RoleType) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      throw new AppError(
        'No authentication token provided',
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        { reason: 'missing_token' }
      );
    }

    try {
      const decoded = authService.verifyToken(token);
      console.log(decoded);
      if (!decoded) {
        throw new AppError(
          'Invalid or malformed authentication token',
          HttpStatusCode.UNAUTHORIZED,
          ErrorCode.INVALID_TOKEN,
          { reason: 'token_verification_failed' }
        );
      }

      if (requiredRole && !hasPermission(decoded.role as RoleType, requiredRole)) {
        throw new AppError(
          'Insufficient permissions to access this resource',
          HttpStatusCode.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          { 
            requiredRole,
            userRole: decoded.role,
            reason: 'insufficient_permissions'
          }
        );
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role as RoleType,
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      throw new AppError(
        errorMessage,
        HttpStatusCode.UNAUTHORIZED,
        ErrorCode.INVALID_TOKEN, 
        {
          reason: 'authentication_error',
          originalError: error instanceof Error ? error.message : String(error)
        }
      );
    }
  };
};

export const requireAuth = () => authMiddleware();
export const requireUser = () => authMiddleware(RoleType.USER);
export const requireAdmin = () => authMiddleware(RoleType.ADMIN);

export const requireAnyRole = (roles: RoleType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authCheck = authMiddleware();
    authCheck(req, res, (error) => {
      if (error) return next(error);
      
      const userRole = req.user?.role as RoleType;
      if (!userRole || !roles.some(role => hasPermission(userRole, role))) {
        throw new AppError(
          'Insufficient permissions to access this resource',
          HttpStatusCode.FORBIDDEN,
          ErrorCode.FORBIDDEN,
          { 
            requiredRoles: roles,
            userRole,
            reason: 'insufficient_permissions'
          }
        );
      }
      
      next();
    });
  };
};
