import { ObjectId } from 'mongodb';
import { Meeting, Vote, Participator } from '../interfaces/meeting.js';
import { 
  getMeetingsCollection, 
  getVotesCollection 
} from '../db/index.js';

/**
 * Generates a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Creates a new meeting in the database
 */
export const createMeeting = async (meeting: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> => {
  const id = generateId();
  const createdAt = new Date().toISOString();
  const newMeeting: Meeting = { ...meeting, id, createdAt };
  
  await getMeetingsCollection().insertOne(newMeeting);
  return newMeeting;
};

/**
 * Gets all meetings
 */
export const getMeetings = async (): Promise<Meeting[]> => {
  return await getMeetingsCollection().find().toArray();
};

/**
 * Gets meetings where a user is a participant with optional status filter
 */
export const getMeetingsByParticipator = async (
  username: string, 
  status?: 'invited' | 'accepted' | 'declined'
): Promise<Meeting[]> => {
  const query: any = {
    participators: {
      $elemMatch: {
        username
      }
    }
  };
  
  // If status is provided, use that, otherwise default to 'accepted' status
  if (status) {
    query.participators.$elemMatch.status = status;
  } else {
    // Default to returning only meetings where user has accepted
    query.participators.$elemMatch.status = 'accepted';
  }
  
  return await getMeetingsCollection().find(query).toArray();
};

/**
 * Updates a participant's response to an invitation
 */
export const respondToInvite = async (
  meetingId: string, 
  username: string, 
  response: 'accepted' | 'declined'
): Promise<boolean> => {
  const result = await getMeetingsCollection().updateOne(
    { 
      id: meetingId, 
      "participators": { 
        $elemMatch: { 
          username, 
          status: 'invited' 
        } 
      } 
    },
    {
      $set: {
        "participators.$.status": response,
        "participators.$.responded_at": new Date().toISOString()
      }
    }
  );
  
  return result.modifiedCount > 0;
};

/**
 * Removes a participant from a meeting
 */
export const removeParticipant = async (
  meetingId: string, 
  username: string, 
  creatorUsername: string
): Promise<boolean> => {
  // First check if the meeting exists and the requester is the creator
  const meeting = await getMeetingsCollection().findOne({ id: meetingId, createdBy: creatorUsername });
  if (!meeting) return false;
  
  // Don't allow removing the creator
  if (username === creatorUsername) return false;
  
  // Remove participant
  const result = await getMeetingsCollection().updateOne(
    { id: meetingId },
    { $pull: { participators: { username } } }
  );
  
  if (result.modifiedCount === 0) return false;
  
  // Delete all votes from this user for this meeting
  await getVotesCollection().deleteMany({
    meetingId,
    username
  });
  
  return true;
};

/**
 * Adds a new participant to a meeting
 */
export const inviteParticipant = async (
  meetingId: string, 
  usernameToInvite: string, 
  creatorUsername: string
): Promise<boolean> => {
  // Check if meeting exists and the requester is the creator
  const meeting = await getMeetingsCollection().findOne({ id: meetingId, createdBy: creatorUsername });
  if (!meeting) return false;
  
  // Check if user is already a participant
  const existingParticipator = meeting.participators.find(p => p.username === usernameToInvite);
  if (existingParticipator) return false;
  
  // Add new participant with invited status
  const result = await getMeetingsCollection().updateOne(
    { id: meetingId },
    {
      $push: {
        participators: {
          username: usernameToInvite,
          status: 'invited'
        }
      }
    }
  );
  
  return result.modifiedCount > 0;
};

/**
 * Deletes a meeting and all associated votes
 */
export const deleteMeeting = async (meetingId: string, creatorUsername: string): Promise<boolean> => {
  // Check if meeting exists and the requester is the creator
  const result = await getMeetingsCollection().deleteOne({ 
    id: meetingId, 
    createdBy: creatorUsername 
  });
  
  if (result.deletedCount === 0) return false;
  
  // Delete all votes for this meeting
  await getVotesCollection().deleteMany({ meetingId });
  
  return true;
};

/**
 * Gets a meeting by ID
 */
export const getMeetingById = async (id: string): Promise<Meeting | null> => {
  return await getMeetingsCollection().findOne({ id });
};

/**
 * Creates a new vote for a meeting
 */
export const createVote = async (vote: Omit<Vote, 'id' | 'createdAt'>): Promise<Vote | null> => {
  // Check for existing vote with same parameters
  const existingVote = await getVotesCollection().findOne({
    meetingId: vote.meetingId,
    username: vote.username,
    date: vote.date,
    hour: vote.hour,
    minute: vote.minute
  });
  
  if (existingVote) return null;
  
  const id = generateId();
  const createdAt = new Date().toISOString();
  const newVote: Vote = { ...vote, id, createdAt };
  
  await getVotesCollection().insertOne(newVote);
  return newVote;
};

/**
 * Gets all votes for a meeting
 */
export const getVotesByMeetingId = async (meetingId: string): Promise<Vote[]> => {
  return await getVotesCollection().find({ meetingId }).toArray();
};

/**
 * Gets aggregated vote results for a meeting
 */
export const getVoteResults = async (meetingId: string): Promise<{ date: string; hour: number; minute: number; count: number }[]> => {
  const meetingVotes = await getVotesByMeetingId(meetingId);
  
  const voteMap: Record<string, Record<string, number>> = {};
  
  meetingVotes.forEach(vote => {
    if (!voteMap[vote.date]) {
      voteMap[vote.date] = {};
    }
    
    const timeKey = `${vote.hour.toString().padStart(2, '0')}:${vote.minute.toString().padStart(2, '0')}`;
    
    if (!voteMap[vote.date][timeKey]) {
      voteMap[vote.date][timeKey] = 0;
    }
    
    voteMap[vote.date][timeKey]++;
  });
  
  const results: { date: string; hour: number; minute: number; count: number }[] = [];
  
  Object.entries(voteMap).forEach(([date, times]) => {
    Object.entries(times).forEach(([timeKey, count]) => {
      const [hourStr, minuteStr] = timeKey.split(':');
      results.push({
        date,
        hour: parseInt(hourStr),
        minute: parseInt(minuteStr),
        count
      });
    });
  });
  
  return results.sort((a, b) => b.count - a.count);
};
