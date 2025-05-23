# Express + Prisma Demo

A simple demo project showing how to use Prisma ORM with Express and MongoDB, including CRUD operations, schema sync, and database seeding.

## Tech Stack
- Express.js
- Prisma ORM
- MongoDB
- TypeScript

## Setup (MongoDB)

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Configure MongoDB:**
   - Ensure you have a running MongoDB instance (e.g., locally or via Docker).
   - Set your `.env` file:
     ```
     DATABASE_URL="mongodb://localhost:27017/express-prisma-demo"
     ```

3. **Prisma Setup:**
   - **Generate Prisma Client:**
     ```sh
     npx prisma generate
     ```
   - **Push Prisma Schema to MongoDB:**
     ```sh
     npx prisma db push
     ```
     > Note: `prisma migrate` is not supported for MongoDB. Use `db push` to sync your schema.

4. **Seed the Database:**
   ```sh
   npm run prisma:seed
   ```
   This will populate the `User` collection with sample data.

5. **Start the Server:**
   - **Development:**
     ```sh
     npm run dev
     ```
   - **Production:**
     ```sh
     npm run build
     npm start
     ```

6. **Start Prisma Studio:**
   ```sh
   npx prisma studio
   ```

## Resetting the MongoDB Database

To reset (drop all data) in your MongoDB database:

- Using the MongoDB shell:
  ```sh
  mongosh
  use express-prisma-demo
  db.dropDatabase()
  ```
  Then repeat steps 3 and 4 to re-sync the schema and seed data.

- Or, if using Docker, remove the MongoDB container/volume and recreate.

## API Endpoints

- `GET    /users`         — List all users
- `GET    /users/:id`     — Get a user by ID
- `POST   /users`         — Create a new user (`{ name, email }`)
- `PUT    /users/:id`     — Update a user (`{ name, email }`)
- `DELETE /users/:id`     — Delete a user

## Notes
- The database is MongoDB, configured via the `DATABASE_URL` in your `.env` file.
- Prisma schema is synced using `prisma db push` (not migrations).
- Database seeding is handled with the script in `prisma/seed.ts`.
- You can switch to another database by changing the `datasource` in `prisma/schema.prisma` and updating your `.env`.
