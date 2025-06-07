import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../config/auth.js';

const JWT_SECRET = AUTH_CONFIG.jwtSecret;

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) {
    res.status(401).json({ message: 'No token provided.' });
    return;
  }
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Invalid token.' });
      return;
    }
    req.user = user;
    next();
  });
}
