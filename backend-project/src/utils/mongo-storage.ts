import { ObjectId } from 'mongodb';
import { Meeting, Vote, Participator } from '../interfaces/meeting.js';
import { 
  getMeetingsCollection, 
  getVotesCollection 
} from '../db/index.js';


export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const createMeeting = async (meeting: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> => {
  const id = generateId();
  const createdAt = new Date().toISOString();
  const newMeeting: Meeting = { ...meeting, id, createdAt };
  
  await getMeetingsCollection().insertOne(newMeeting);
  return newMeeting;
};

export const getMeetings = async (): Promise<Meeting[]> => {
  return await getMeetingsCollection().find().toArray();
};

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
  
  if (status) {
    query.participators.$elemMatch.status = status;
  } else {
    query.participators.$elemMatch.status = 'accepted';
  }
  
  return await getMeetingsCollection().find(query).toArray();
};

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

export const removeParticipant = async (
  meetingId: string, 
  username: string, 
  creatorUsername: string
): Promise<boolean> => {
  const meeting = await getMeetingsCollection().findOne({ id: meetingId, createdBy: creatorUsername });
  if (!meeting) return false;
  
  if (username === creatorUsername) return false;
  
  const result = await getMeetingsCollection().updateOne(
    { id: meetingId },
    { $pull: { participators: { username } } }
  );
  
  if (result.modifiedCount === 0) return false;
  
  await getVotesCollection().deleteMany({
    meetingId,
    username
  });
  
  return true;
};

export const inviteParticipant = async (
  meetingId: string, 
  usernameToInvite: string, 
  creatorUsername: string
): Promise<boolean> => {
  const meeting = await getMeetingsCollection().findOne({ id: meetingId, createdBy: creatorUsername });
  if (!meeting) return false;
  
  const existingParticipator = meeting.participators.find(p => p.username === usernameToInvite);
  if (existingParticipator) return false;
  
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

export const deleteMeeting = async (meetingId: string, creatorUsername: string): Promise<boolean> => {
  const result = await getMeetingsCollection().deleteOne({ 
    id: meetingId, 
    createdBy: creatorUsername 
  });
  
  if (result.deletedCount === 0) return false;
  
  await getVotesCollection().deleteMany({ meetingId });
  
  return true;
};

export const getMeetingById = async (id: string): Promise<Meeting | null> => {
  return await getMeetingsCollection().findOne({ id });
};

export const createVote = async (vote: Omit<Vote, 'id' | 'createdAt'>): Promise<Vote | null> => {
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

export const getVotesByMeetingId = async (meetingId: string): Promise<Vote[]> => {
  return await getVotesCollection().find({ meetingId }).toArray();
};

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
