import { MongoClient, Collection, Db } from 'mongodb';
import { DB_CONFIG } from '../config/db.js';
import { Meeting } from '../interfaces/meeting.js';
import { User } from '../interfaces/user.js';
import { Vote } from '../interfaces/meeting.js';

// Interface for database collections
interface Collections {
  users: Collection<User>;
  meetings: Collection<Meeting>;
  votes: Collection<Vote>;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let collections: Collections | null = null;

export async function connectToDatabase(): Promise<void> {
  try {
    client = new MongoClient(DB_CONFIG.uri);
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    db = client.db(DB_CONFIG.databaseName);
    
    collections = {
      users: db.collection<User>('users'),
      meetings: db.collection<Meeting>('meetings'),
      votes: db.collection<Vote>('votes')
    };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  try {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
  } finally {
    client = null;
    db = null;
    collections = null;
  }
}

export function getUsersCollection(): Collection<User> {
  if (!collections) {
    throw new Error('Database connection not established. Call connectToDatabase() first.');
  }
  return collections.users;
}

export function getMeetingsCollection(): Collection<Meeting> {
  if (!collections) {
    throw new Error('Database connection not established. Call connectToDatabase() first.');
  }
  return collections.meetings;
}

export function getVotesCollection(): Collection<Vote> {
  if (!collections) {
    throw new Error('Database connection not established. Call connectToDatabase() first.');
  }
  return collections.votes;
}
