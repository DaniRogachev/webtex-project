"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
// CRUD routes for User
app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});
app.get('/users/:id', async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (user)
        res.json(user);
    else
        res.status(404).json({ error: 'User not found' });
});
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await prisma.user.create({ data: { name, email } });
        res.status(201).json(user);
    }
    catch (e) {
        res.status(400).json({ error: 'Email must be unique' });
    }
});
app.put('/users/:id', async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: Number(req.params.id) },
            data: { name, email },
        });
        res.json(user);
    }
    catch (e) {
        res.status(404).json({ error: 'User not found or email not unique' });
    }
});
app.delete('/users/:id', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'User deleted' });
    }
    catch (e) {
        res.status(404).json({ error: 'User not found' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
