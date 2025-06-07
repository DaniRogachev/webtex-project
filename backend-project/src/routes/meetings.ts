import express, { Response, Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authenticateToken.js';
import { Meeting, Vote, Participator } from '../interfaces/meeting.js';
import { 
  createMeeting, 
  getMeetings, 
  getMeetingById, 
  createVote, 
  getVotesByMeetingId, 
  getVoteResults,
  getMeetingsByParticipator,
  respondToInvite,
  removeParticipant,
  inviteParticipant,
  deleteMeeting
} from '../utils/mongo-storage.js';

const router: Router = express.Router();

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, startDate, endDate, invitedUsers } = req.body;
  
  if (!title || !description || !startDate || !endDate) {
    res.status(400).json({ message: 'Title, description, startDate and endDate are required.' });
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ message: 'Invalid date format. Use ISO 8601 format.' });
    return;
  }
  
  if (start > end) {
    res.status(400).json({ message: 'Start date must be before end date.' });
    return;
  }
  
  // Prevent past dates
  const currentDate = new Date();
  // Reset time to start of day for fair comparison
  currentDate.setHours(0, 0, 0, 0);
  
  if (start < currentDate) {
    res.status(400).json({ message: 'Start date cannot be in the past.' });
    return;
  }
  
  if (end < currentDate) {
    res.status(400).json({ message: 'End date cannot be in the past.' });
    return;
  }
  
  // Validate invited users is an array
  if (invitedUsers && !Array.isArray(invitedUsers)) {
    res.status(400).json({ message: 'Invited users must be an array of usernames.' });
    return;
  }
  
  // Create participators list
  const participators: Participator[] = [];
  
  // Add creator as an accepted participator
  if (req.user?.username) {
    participators.push({
      username: req.user.username,
      status: 'accepted',
      responded_at: new Date().toISOString()
    });
  }
  
  // Add invited users
  if (Array.isArray(invitedUsers)) {
    invitedUsers.forEach((username: string) => {
      // Don't add the creator again
      if (username !== req.user?.username) {
        participators.push({
          username,
          status: 'invited'
        });
      }
    });
  }
  
  try {
    const newMeeting = await createMeeting({
      title,
      description,
      startDate,
      endDate,
      createdBy: req.user?.username,
      participators
    });
    
    res.status(201).json(newMeeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Failed to create meeting.' });
  }
});

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get only meetings where the current user is a participator
    const userMeetings = await getMeetingsByParticipator(req.user!.username);
    res.json(userMeetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Failed to fetch meetings.' });
  }
});

// Get meetings where the user is invited but hasn't responded yet
router.get('/invited', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const invitedMeetings = await getMeetingsByParticipator(req.user!.username, 'invited');
    res.json(invitedMeetings);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ message: 'Failed to fetch invites.' });
  }
});

// Respond to an invite
router.post('/:meetingId/respond-to-invite', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { meetingId } = req.params;
  const { reply } = req.body;
  
  if (reply !== 'accept' && reply !== 'decline') {
    res.status(400).json({ message: 'Reply must be either "accept" or "decline".' });
    return;
  }
  
  try {
    const response = reply === 'accept' ? 'accepted' : 'declined';
    const success = await respondToInvite(meetingId, req.user?.username || '', response);
    
    if (!success) {
      res.status(404).json({ message: 'Meeting not found or you are not invited to this meeting.' });
      return;
    }
    
    res.json({ message: `Successfully ${response} the meeting invitation.` });
  } catch (error) {
    console.error('Error responding to invite:', error);
    res.status(500).json({ message: 'Failed to respond to invite.' });
  }
});

// Remove a participant (creator only)
router.delete('/:meetingId/participants', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { meetingId } = req.params;
  const { username } = req.body;
  
  if (!username) {
    res.status(400).json({ message: 'Username is required.' });
    return;
  }
  
  try {
    const success = await removeParticipant(meetingId, username, req.user?.username || '');
    
    if (!success) {
      res.status(403).json({ 
        message: 'Failed to remove participant. Either the meeting does not exist, you are not the creator, ' +
                'the participant does not exist, or you are trying to remove yourself as the creator.' 
      });
      return;
    }
    
    res.json({ message: `Successfully removed participant ${username} from the meeting.` });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Failed to remove participant.' });
  }
});

// Invite a new participant (creator only)
router.post('/:meetingId/participants', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { meetingId } = req.params;
  const { username } = req.body;
  
  if (!username) {
    res.status(400).json({ message: 'Username is required.' });
    return;
  }
  
  try {
    const success = await inviteParticipant(meetingId, username, req.user?.username || '');
    
    if (!success) {
      res.status(403).json({ 
        message: 'Failed to invite participant. Either the meeting does not exist, you are not the creator, ' +
                'or the participant is already invited.' 
      });
      return;
    }
    
    res.json({ message: `Successfully invited ${username} to the meeting.` });
  } catch (error) {
    console.error('Error inviting participant:', error);
    res.status(500).json({ message: 'Failed to invite participant.' });
  }
});

// Delete a meeting (creator only)
router.delete('/:meetingId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { meetingId } = req.params;
  
  try {
    const success = await deleteMeeting(meetingId, req.user?.username || '');
    
    if (!success) {
      res.status(403).json({ 
        message: 'Failed to delete meeting. Either the meeting does not exist or you are not the creator.' 
      });
      return;
    }
    
    res.json({ message: 'Successfully deleted the meeting.' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Failed to delete meeting.' });
  }
});

router.post('/:meetingId/vote', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { meetingId } = req.params;
  const { date, hour, minute } = req.body;
  const username = req.user?.username;
  
  if (!date || hour === undefined || minute === undefined) {
    res.status(400).json({ message: 'Date, hour, and minute are required.' });
    return;
  }
  
  if (hour < 0 || hour > 23 || !Number.isInteger(hour)) {
    res.status(400).json({ message: 'Hour must be an integer between 0 and 23.' });
    return;
  }
  
  if (minute < 0 || minute > 59 || !Number.isInteger(minute)) {
    res.status(400).json({ message: 'Minute must be an integer between 0 and 59.' });
    return;
  }
  
  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    res.status(404).json({ message: 'Meeting not found.' });
    return;
  }
  
  const voteDate = new Date(date);
  const meetingStart = new Date(meeting.startDate);
  const meetingEnd = new Date(meeting.endDate);
  
  if (isNaN(voteDate.getTime())) {
    res.status(400).json({ message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD).' });
    return;
  }
  
  voteDate.setHours(0, 0, 0, 0);
  meetingStart.setHours(0, 0, 0, 0);
  meetingEnd.setHours(0, 0, 0, 0);
  
  if (voteDate < meetingStart || voteDate > meetingEnd) {
    res.status(400).json({ message: 'Vote date must be within the meeting date range.' });
    return;
  }
  
  try {
    const newVote = await createVote({
      meetingId,
      username,
      date,
      hour,
      minute
    });
    
    if (newVote === null) {
      res.status(409).json({ message: 'You have already voted for this date and time.' });
      return;
    }
    
    res.status(201).json(newVote);
  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ message: 'Failed to create vote.' });
  }
});

router.get('/:meetingId/votes', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { meetingId } = req.params;
  
  try {
    const meeting = await getMeetingById(meetingId);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }
    
    const votes = await getVotesByMeetingId(meetingId);
    
    const results = await getVoteResults(meetingId);
    
    res.json({
      meeting,
      votes,
      results
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ message: 'Failed to fetch votes.' });
  }
});

export default router;
