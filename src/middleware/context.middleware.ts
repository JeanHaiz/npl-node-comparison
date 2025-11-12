import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { AuthenticatedRequest } from './auth.middleware';

export interface RequestContext {
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Create async local storage for request context
export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Middleware to set up request context for the entire request lifecycle
 * This allows us to access user info in any part of the application
 */
export const contextMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const context: RequestContext = {
    userId: req.user?.sub,
    userEmail: req.user?.email,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  requestContext.run(context, () => {
    next();
  });
};

/**
 * Get current request context
 */
export const getContext = (): RequestContext | undefined => {
  return requestContext.getStore();
};
