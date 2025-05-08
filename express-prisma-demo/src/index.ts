import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// CRUD routes for User
app.get('/users', async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/users/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (user) res.json(user);
  else res.status(404).json({ error: 'User not found' });
});

app.post('/users', async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.create({ data: { name, email } });
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: 'Email must be unique' });
  }
});

app.put('/users/:id', async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email },
    });
    res.json(user);
  } catch (e) {
    res.status(404).json({ error: 'User not found or email not unique' });
  }
});

app.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: 'User not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
