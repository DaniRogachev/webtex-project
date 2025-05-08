# Express + Prisma Demo

A simple demo project showing how to use Prisma ORM with Express, including CRUD operations, migrations, and database seeding.

## Tech Stack
- Express.js
- Prisma ORM
- SQLite (for demo purposes)
- TypeScript

## Setup

1. **Install dependencies:**
   npm install

2. **Initialize Prisma and run migrations:**
   npx prisma migrate dev --name init
   npx prisma generate

3. **Seed the database:**
   npm run prisma:seed

4. **Start the server:**
   npm run dev

## API Endpoints

- `GET    /users`         — List all users
- `GET    /users/:id`     — Get a user by ID
- `POST   /users`         — Create a new user (`{ name, email }`)
- `PUT    /users/:id`     — Update a user (`{ name, email }`)
- `DELETE /users/:id`     — Delete a user

## Notes
- The database is SQLite and stored in `prisma/dev.db`.
- Prisma migrations and seeds are handled with scripts in `package.json`.
- You can easily switch to another database (Postgres, MySQL, etc.) by changing the `datasource` in `prisma/schema.prisma`.
