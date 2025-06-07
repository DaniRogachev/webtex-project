# webtex-project
Repository for the project for the WEBTECH course in FMI

## Project Setup

### MongoDB Setup

#### Starting MongoDB Server

1. Create a directory for MongoDB data (if it doesn't exist):
   ```bash
   mkdir -p /tmp/mongo_data
   ```

2. Start the MongoDB server:
   ```bash
   mongod --dbpath /tmp/mongo_data
   ```

3. Apply the database schema:
   ```bash
   mongosh mongodb://localhost:27017/vote_for_meeting database/document-schema/create-schema.js
   ```

#### Restarting MongoDB

If you need to restart the MongoDB server later:

1. Stop any running MongoDB process (if needed):
   ```bash
   pkill -f mongod
   ```

2. Start MongoDB server again:
   ```bash
   mongod --dbpath /tmp/mongo_data
   ```

### Starting the Backend Server

1. Navigate to the backend project directory:
   ```bash
   cd backend-project
   ```

2. Start the server:
   ```bash
   npm start
   ```

### Running the Complete Application

1. Start MongoDB as described above
2. Start the backend server
3. Start the frontend server:
   ```bash
   cd frontend-project
   npm start
   ```

The backend API will be available at http://localhost:3000, and the frontend will run on http://localhost:3001.
