import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authenticateToken.js';

const router: Router = express.Router();
const JWT_SECRET = 'your_jwt_secret';

interface User {
  username: string;
  password: string;
}

const users: User[] = [];

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required.' });
    return;
  }
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    res.status(409).json({ message: 'User already exists.' });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.status(201).json({ message: 'User registered.' });
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    res.status(404).json({ message: 'Invalid credentials.' });
    return;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(404).json({ message: 'Invalid credentials.' });
    return;
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // set to true in production with HTTPS
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  res.json({ message: 'Login successful' });
});

router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out' });
});

router.get('/currentUser', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  res.json({ username: req.user?.username });
});

export default router;
