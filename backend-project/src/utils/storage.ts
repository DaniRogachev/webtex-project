import { Meeting, Vote, Participator } from '../interfaces/meeting.js';

export const meetings: Map<string, Meeting> = new Map();
export const votes: Map<string, Vote> = new Map();

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const createMeeting = (meeting: Omit<Meeting, 'id' | 'createdAt'>): Meeting => {
  const id = generateId();
  const createdAt = new Date().toISOString();
  const newMeeting: Meeting = { ...meeting, id, createdAt };
  meetings.set(id, newMeeting);
  return newMeeting;
};

export const getMeetings = (): Meeting[] => {
  return Array.from(meetings.values());
};

export const getMeetingsByParticipator = (username: string, status?: 'invited' | 'accepted' | 'declined'): Meeting[] => {
  return Array.from(meetings.values()).filter(meeting => {
    const participator = meeting.participators.find(p => p.username === username);
    if (!participator) return false;
    return status ? participator.status === status : true;
  });
};

export const respondToInvite = (meetingId: string, username: string, response: 'accepted' | 'declined'): boolean => {
  const meeting = meetings.get(meetingId);
  if (!meeting) return false;
  
  const participatorIndex = meeting.participators.findIndex(p => p.username === username && p.status === 'invited');
  if (participatorIndex === -1) return false;
  
  meeting.participators[participatorIndex] = {
    username,
    status: response === 'accepted' ? 'accepted' : 'declined',
    responded_at: new Date().toISOString()
  };
  
  meetings.set(meetingId, meeting);
  return true;
};

export const removeParticipant = (meetingId: string, username: string, creatorUsername: string): boolean => {
  const meeting = meetings.get(meetingId);
  
  // Check if meeting exists and the requester is the creator
  if (!meeting || meeting.createdBy !== creatorUsername) return false;
  
  // Don't allow removing the creator
  if (username === creatorUsername) return false;
  
  // Check if the user is a participant
  const participatorIndex = meeting.participators.findIndex(p => p.username === username);
  if (participatorIndex === -1) return false;
  
  // Remove participant
  meeting.participators.splice(participatorIndex, 1);
  
  // Delete all votes from this user for this meeting
  const voteEntries = Array.from(votes.entries());
  for (const [voteId, vote] of voteEntries) {
    if (vote.meetingId === meetingId && vote.username === username) {
      votes.delete(voteId);
    }
  }
  
  meetings.set(meetingId, meeting);
  return true;
};

export const inviteParticipant = (meetingId: string, usernameToInvite: string, creatorUsername: string): boolean => {
  const meeting = meetings.get(meetingId);
  
  // Check if meeting exists and the requester is the creator
  if (!meeting || meeting.createdBy !== creatorUsername) return false;
  
  // Check if user is already a participant
  const existingParticipator = meeting.participators.find(p => p.username === usernameToInvite);
  if (existingParticipator) return false;
  
  // Add new participant with invited status
  meeting.participators.push({
    username: usernameToInvite,
    status: 'invited'
  });
  
  meetings.set(meetingId, meeting);
  return true;
};

export const deleteMeeting = (meetingId: string, creatorUsername: string): boolean => {
  const meeting = meetings.get(meetingId);
  
  // Check if meeting exists and the requester is the creator
  if (!meeting || meeting.createdBy !== creatorUsername) return false;
  
  // Delete meeting
  meetings.delete(meetingId);
  
  // Delete all votes for this meeting
  const voteEntries = Array.from(votes.entries());
  for (const [voteId, vote] of voteEntries) {
    if (vote.meetingId === meetingId) {
      votes.delete(voteId);
    }
  }
  
  return true;
};

export const getMeetingById = (id: string): Meeting | undefined => {
  return meetings.get(id);
};

export const createVote = (vote: Omit<Vote, 'id' | 'createdAt'>): Vote | null => {
  const existingVote = Array.from(votes.values()).find(v => 
    v.meetingId === vote.meetingId && 
    v.username === vote.username && 
    v.date === vote.date && 
    v.hour === vote.hour && 
    v.minute === vote.minute
  );

  if (existingVote) {
    return null;
  }

  const id = generateId();
  const createdAt = new Date().toISOString();
  const newVote: Vote = { ...vote, id, createdAt };
  votes.set(id, newVote);
  return newVote;
};

export const getVotesByMeetingId = (meetingId: string): Vote[] => {
  return Array.from(votes.values()).filter(vote => vote.meetingId === meetingId);
};

export const getVoteResults = (meetingId: string): { date: string; hour: number; minute: number; count: number }[] => {
  const meetingVotes = getVotesByMeetingId(meetingId);
  
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
