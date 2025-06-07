import * as React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarWithHourModalProps {
  startDate: string;
  endDate: string;
  meetingId: string;
  onVoteSuccess?: () => void;
  existingVotes?: Vote[];
}

interface HourModalProps {
  date: Date | null;
  minDateTime: Date;
  onSelectTime: (hour: number, minute: number) => string | null;
  onClose: () => void;
}

const HourModal: React.FC<HourModalProps> = ({ date, minDateTime, onSelectTime, onClose }) => {
  const [time, setTime] = React.useState('');
  const [error, setError] = React.useState('');

  if (!date) return null;

  let minTime = '00:00';
  const isSameDay = date.toDateString() === minDateTime.toDateString();
  if (isSameDay) {
    minTime = minDateTime.toTimeString().slice(0, 5);
  }

  const handleConfirm = () => {
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError('Please enter a valid time in HH:mm format.');
      return;
    }
    const [hour, minute] = time.split(':').map(Number);
    const chosen = new Date(date);
    chosen.setHours(hour, minute, 0, 0);
    if (chosen < minDateTime) {
      setError('Selected time must be at least 1 hour from now.');
      return;
    }
    const selectTimeError: string | null = onSelectTime(hour, minute);
    if (selectTimeError) {
      setError(selectTimeError);
      return;
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <h3>Select time for {date.toLocaleDateString()}</h3>
        <input
          type="time"
          value={time}
          min={minTime}
          onChange={e => { setTime(e.target.value); setError(''); }}
          style={{ fontSize: 18, padding: 8, marginBottom: 8 }}
        />
        <div>
          <button style={{ marginRight: 8 }} onClick={handleConfirm}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
        {error && <div style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  minWidth: 320,
  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
};

export interface Vote {
  id: string;
  meetingId: string;
  username: string;
  date: string;
  hour: number;
  minute: number;
  createdAt: string;
}

const CalendarWithHourModal: React.FC<CalendarWithHourModalProps> = ({ 
  startDate, 
  endDate, 
  meetingId, 
  onVoteSuccess, 
  existingVotes = [] 
}) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const minDateTime = new Date(startDate);
  const maxDateTime = new Date(endDate);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [chosenDates, setChosenDates] = React.useState<{ date: Date; hour: number; minute: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };


  const handleSelectTime = (hour: number, minute: number): string | null => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(hour, minute, 0, 0);
      if (!chosenDates.some(sel => sel.date.getTime() === newDate.getTime())) {
        setChosenDates(prev => [...prev, { date: newDate, hour, minute }]);
      }else{
        return 'Date already selected';
      }
    }
    setShowModal(false);
    return null;
  };

  const handleRemove = (idx: number) => {
    setChosenDates(prev => prev.filter((_, i) => i !== idx));
  };

  const tileDisabled = ({ date }: { date: Date }) => {
    // Clone the dates and reset the time components for fair date comparison
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    const minDate = new Date(minDateTime);
    minDate.setHours(0, 0, 0, 0);
    
    const maxDate = new Date(maxDateTime);
    maxDate.setHours(23, 59, 59, 999);
    
    if (dateToCheck < minDate) return true;
    if (dateToCheck > maxDate) return true;
    
    return false;
  };

  // Set minimum time for the selected date
  let minTimeForModal = '00:00';
  let minDateTimeForModal = new Date(minDateTime);

  // If the selected date is today, set minimum time to one hour from now
  const today = new Date();
  if (selectedDate && selectedDate.toDateString() === today.toDateString()) {
    const minAllowed = new Date(today.getTime() + 60 * 60 * 1000); // One hour from now
    minTimeForModal = minAllowed.toTimeString().slice(0, 5);
    minDateTimeForModal = minAllowed;
  }
  // If the selected date is the meeting start date (but not today), use its time
  else if (selectedDate && 
          selectedDate.toDateString() === minDateTime.toDateString() && 
          selectedDate.toDateString() !== today.toDateString()) {
    minTimeForModal = minDateTime.toTimeString().slice(0, 5);
    minDateTimeForModal = new Date(minDateTime);
  }

  // Add a function to handle vote submission
  const handleSubmitVotes = async () => {
    if (chosenDates.length === 0) {
      setSubmissionError('Please select at least one date and time');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      // Submit each vote separately
      for (const vote of chosenDates) {
        const dateString = vote.date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        const response = await fetch(`http://localhost:3000/api/meetings/${meetingId}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            date: dateString,
            hour: vote.hour,
            minute: vote.minute
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
      }
      
      // Clear selected dates after successful submission
      setChosenDates([]);
      
      // Call the success callback if provided
      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (error: any) {
      setSubmissionError(error.message || 'Failed to submit votes');
      console.error('Vote submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display already voted times if provided
  React.useEffect(() => {
    if (existingVotes && existingVotes.length > 0) {
      // Just for display purposes - we don't want to submit these again
      const existingVoteDates = existingVotes.map(vote => {
        const date = new Date(vote.date);
        return { date, hour: vote.hour, minute: vote.minute };
      });
    }
  }, [existingVotes]);

  return (
    <div style={{ maxWidth: 400, margin: '20px auto', textAlign: 'center', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <h3>Vote for Meeting Times</h3>
      <p>Select dates and times that work for you.</p>
      
      <Calendar
        onClickDay={handleDateClick}
        minDate={minDateTime}
        maxDate={maxDateTime}
        tileDisabled={tileDisabled}
      />
      {showModal && (
        <HourModal
          date={selectedDate}
          minDateTime={minDateTimeForModal}
          onSelectTime={handleSelectTime}
          onClose={() => setShowModal(false)}
        />
      )}
      {chosenDates.length > 0 && (
        <div style={{ marginTop: 24, fontSize: 18, textAlign: 'left' }}>
          <strong>Selected Times:</strong>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {chosenDates.map((item, idx) => (
              <li key={`${item.date.toISOString()}-${item.hour}-${item.minute}`} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>
                  {item.date.toLocaleDateString()} at {item.hour.toString().padStart(2, '0')}:{item.minute.toString().padStart(2, '0')} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </span>
                <button onClick={() => handleRemove(idx)} style={{ marginLeft: 8, color: '#d32f2f', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button 
              onClick={handleSubmitVotes}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Votes'}
            </button>
          </div>
          
          {submissionError && (
            <div style={{ color: '#d32f2f', marginTop: 8, textAlign: 'center' }}>
              {submissionError}
            </div>
          )}
        </div>
      )}
      
      {existingVotes && existingVotes.length > 0 && (
        <div style={{ marginTop: 24, fontSize: 18, textAlign: 'left', borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <strong>Your Current Votes:</strong>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {existingVotes.map(vote => (
              <li key={vote.id} style={{ marginBottom: 8 }}>
                {new Date(vote.date).toLocaleDateString()} at {vote.hour.toString().padStart(2, '0')}:{vote.minute.toString().padStart(2, '0')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CalendarWithHourModal;
