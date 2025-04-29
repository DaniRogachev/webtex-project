# Backend Project TypeScript

This is a TypeScript implementation of the Express backend with authentication features.

## Features

- User registration
- User login and logout with JWT authentication
- Protected routes using authentication middleware
- CORS configuration for frontend integration

## Setup and Running

1. Install dependencies:
```
npm install
```

2. Run the development server:
```
npm run dev
```

3. Build for production:
```
npm run build
```

4. Run production build:
```
npm start
```

The server runs on http://localhost:3000 by default.

## API Endpoints

- POST `/api/register` - Register a new user
- POST `/api/login` - Log in a user
- POST `/api/logout` - Log out a user
- GET `/api/currentUser` - Get current authenticated user
