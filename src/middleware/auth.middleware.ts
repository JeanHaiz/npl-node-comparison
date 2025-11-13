import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    sub: string;
    email?: string;
    preferred_username?: string;
    name?: string;
    realm_access?: {
      roles: string[];
    };
    resource_access?: Record<string, { roles: string[] }>;
  };
}

// Create JWKS client to fetch Keycloak public keys
const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Middleware to authenticate JWT tokens from Keycloak
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token
    jwt.verify(
      token,
      getKey,
      {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          logger.error('JWT verification failed', { error: err.message });
          return res.status(401).json({ error: 'Invalid token' });
        }

        const decodedUser = decoded as any;
        req.user = {
          ...decodedUser,
          userId: decodedUser.sub,
        };
        logger.info('User authenticated', {
          userId: req.user?.userId,
          email: req.user?.email,
        });
        next();
      }
    );
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has required roles
 */
export const authorize = (...requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRoles = req.user.realm_access?.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      logger.warn('Authorization failed', {
        userId: req.user.sub,
        requiredRoles,
        userRoles,
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token is provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    jwt.verify(
      token,
      getKey,
      {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (!err) {
          const decodedUser = decoded as any;
          req.user = {
            ...decodedUser,
            userId: decodedUser.sub,
          };
        }
        next();
      }
    );
  } catch (error) {
    next();
  }
};
