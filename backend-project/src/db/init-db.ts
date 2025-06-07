import { MongoClient } from 'mongodb';
import { DB_CONFIG } from '../config/db.js';


export async function initializeDatabase(): Promise<void> {
  const client = new MongoClient(DB_CONFIG.uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for initialization');
    
    const db = client.db(DB_CONFIG.databaseName);
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      await db.collection('users').createIndex({ username: 1 }, { unique: true });
      console.log('Created users collection with indexes');
    }
    
    if (!collectionNames.includes('meetings')) {
      await db.createCollection('meetings');
      await db.collection('meetings').createIndex({ id: 1 }, { unique: true });
      await db.collection('meetings').createIndex({ createdBy: 1 });
      await db.collection('meetings').createIndex({ 'participators.username': 1 });
      console.log('Created meetings collection with indexes');
    }
    
    if (!collectionNames.includes('votes')) {
      await db.createCollection('votes');
      await db.collection('votes').createIndex({ id: 1 }, { unique: true });
      await db.collection('votes').createIndex({ meetingId: 1 });
      await db.collection('votes').createIndex({ username: 1 });
      await db.collection('votes').createIndex(
        { meetingId: 1, username: 1, date: 1, hour: 1, minute: 1 },
        { unique: true }
      );
      console.log('Created votes collection with indexes');
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    await client.close();
  }
}
