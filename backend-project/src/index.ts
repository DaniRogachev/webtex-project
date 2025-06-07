import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';
import usersRoutes from './routes/users.js';
import { connectToDatabase } from './db/index.js';
import { initializeDatabase } from './db/init-db.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(cookieParser());

app.use('/api', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', usersRoutes);

initializeDatabase()
  .then(() => connectToDatabase())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error('Failed to connect to MongoDB. Server not started:', error);
    process.exit(1);
  });
