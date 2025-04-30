import express, { Response, Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authenticateToken.js';
import { Meeting, Vote } from '../interfaces/meeting.js';
import { 
  createMeeting, 
  getMeetings, 
  getMeetingById, 
  createVote, 
  getVotesByMeetingId, 
  getVoteResults 
} from '../utils/storage.js';

const router: Router = express.Router();

router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { title, description, startDate, endDate } = req.body;
  
  if (!title || !description || !startDate || !endDate) {
    res.status(400).json({ message: 'Title, description, startDate and endDate are required.' });
    return;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Set time to beginning of the day for proper comparison
  now.setHours(0, 0, 0, 0);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ message: 'Invalid date format. Use ISO 8601 format.' });
    return;
  }
  
  // Check if start date is in the past
  if (start < now) {
    res.status(400).json({ message: 'Cannot schedule meetings in the past. Start date must be today or later.' });
    return;
  }
  
  if (start > end) {
    res.status(400).json({ message: 'Start date must be before end date.' });
    return;
  }
  
  try {
    const newMeeting = createMeeting({
      title,
      description,
      startDate,
      endDate,
      createdBy: req.user?.username
    });
    
    res.status(201).json(newMeeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Failed to create meeting.' });
  }
});

router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const allMeetings = getMeetings();
    res.json(allMeetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Failed to fetch meetings.' });
  }
});

router.post('/:meetingId/vote', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
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
  
  const meeting = getMeetingById(meetingId);
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
    const newVote = createVote({
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

router.get('/:meetingId/votes', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { meetingId } = req.params;
  
  const meeting = getMeetingById(meetingId);
  if (!meeting) {
    res.status(404).json({ message: 'Meeting not found.' });
    return;
  }
  
  try {
    const votes = getVotesByMeetingId(meetingId);
    
    const results = getVoteResults(meetingId);
    
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
