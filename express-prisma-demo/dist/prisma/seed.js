"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.user.createMany({
        data: [
            { name: 'Aleksandar', email: 'aleksandar1@example.com' },
            { name: 'Martin', email: 'martin1@example.com' },
            { name: 'Daniel', email: 'danie1l@example.com' },
            { name: 'Vasilen', email: 'vasil1en@example.com' },
            { name: 'Ivelin', email: 'ivel1in@example.com' },
        ],
    });
    console.log('Database seeded!');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
