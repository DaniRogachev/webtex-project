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

// Global variables for connection
let client: MongoClient | null = null;
let db: Db | null = null;
let collections: Collections | null = null;

/**
 * Initialize the database connection
 */
export async function connectToDatabase(): Promise<void> {
  try {
    // Connect to MongoDB
    client = new MongoClient(DB_CONFIG.uri);
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    // Get the database
    db = client.db(DB_CONFIG.databaseName);
    
    // Initialize collections
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

/**
 * Close the database connection
 */
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

/**
 * Get the users collection
 */
export function getUsersCollection(): Collection<User> {
  if (!collections) {
    throw new Error('Database connection not established. Call connectToDatabase() first.');
  }
  return collections.users;
}

/**
 * Get the meetings collection
 */
export function getMeetingsCollection(): Collection<Meeting> {
  if (!collections) {
    throw new Error('Database connection not established. Call connectToDatabase() first.');
  }
  return collections.meetings;
}

/**
 * Get the votes collection
 */
export function getVotesCollection(): Collection<Vote> {
  if (!collections) {
    throw new Error('Database connection not established. Call connectToDatabase() first.');
  }
  return collections.votes;
}
