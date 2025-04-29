import { Meeting, Vote } from '../interfaces/meeting.js';

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
