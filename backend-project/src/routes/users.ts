import express, { Router, Response } from 'express';
import { getUsersCollection } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authenticateToken.js';

const router: Router = express.Router();

// Get all users (simplified user info - just usernames)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const usersCollection = getUsersCollection();
    
    // Only fetch usernames, exclude passwords and other sensitive info
    const users = await usersCollection.find({}, { projection: { username: 1, _id: 0 } }).toArray();
    
    // Extract just the usernames to return a simple array
    const usernames = users.map(user => user.username);
    
    res.json(usernames);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

export default router;
