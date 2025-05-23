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
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (user)
        res.json(user);
    else
        res.status(404).json({ error: 'User not found' });
});
app.post('/users', async (req, res) => {
    const { name, email, age, height } = req.body;
    try {
        const user = await prisma.user.create({ data: { name, email, age, height } });
        res.status(201).json(user);
    }
    catch (e) {
        res.status(400).json({ error: 'Cannot create user' });
    }
});
app.put('/users/:id', async (req, res) => {
    const { name, email, age, height } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name, email, age, height },
        });
        res.json(user);
    }
    catch (e) {
        res.status(404).json({ error: 'User not found or email not unique' });
    }
});
app.delete('/users/:id', async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (e) {
        res.status(404).json({ error: 'User not found' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
