import * as React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarWithHourModalProps {
  startDate?: Date;
  endDate?: Date;
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

const CalendarWithHourModal: React.FC<CalendarWithHourModalProps> = ({ startDate, endDate }) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const minDateTime = startDate ? new Date(startDate) : todayStart;
  const maxDateTime = endDate ? new Date(endDate) : undefined;

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [chosenDates, setChosenDates] = React.useState<{ date: Date; hour: number; minute: number }[]>([]);

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
    if (date < minDateTime) return true;
    if (maxDateTime && date > maxDateTime) return true;
    return false;
  };

  let minTimeForModal = '00:00';
  let minDateTimeForModal = minDateTime;
  if (selectedDate && selectedDate.toDateString() === now.toDateString()) {
    const minAllowed = new Date(now.getTime() + 60 * 60 * 1000);
    minTimeForModal = minAllowed.toTimeString().slice(0, 5);
    minDateTimeForModal = minAllowed;
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', textAlign: 'center' }}>
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
          <strong>Selected Dates:</strong>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {chosenDates.map((item, idx) => (
              <li key={item.date.toISOString()} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                <span style={{ flex: 1 }}>
                  {item.date.toLocaleDateString()} at {item.hour.toString().padStart(2, '0')}:{item.minute.toString().padStart(2, '0')} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </span>
                <button onClick={() => handleRemove(idx)} style={{ marginLeft: 8, color: '#d32f2f', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CalendarWithHourModal;
