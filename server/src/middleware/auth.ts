import { Request, Response, NextFunction } from 'express'; 
import jwt from 'jsonwebtoken';
// This middleware handles authentication and authorization for the server. It verifies JWT tokens, checks user roles, and attaches user information to the request object for further processing in protected routes.


export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'supervisor' | 'manager' | 'administrator';
}


declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Checkpoint 1: must have a valid token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// Checkpoint 2: must have one of the allowed roles
export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not allowed to do this' });
    }
    next();
  };
}