import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authenticateToken.js';
import { getUsersCollection } from '../db/index.js';
import { AUTH_CONFIG } from '../config/auth.js';

const router: Router = express.Router();
const JWT_SECRET = AUTH_CONFIG.jwtSecret;


router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required.' });
    return;
  }
  
  if (password.length < 8) {
    res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    return;
  }
  
  try {
    const usersCollection = getUsersCollection();
    
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      res.status(409).json({ message: 'User already exists.' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, password: hashedPassword });
    
    res.status(201).json({ message: 'User registered.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  
  try {
    const usersCollection = getUsersCollection();
    
    const user = await usersCollection.findOne({ username });
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
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    
    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
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
