import React, { useState } from 'react';

interface CreateMeetingModalProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ onClose, onSubmitSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invitedUsers, setInvitedUsers] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Function to get today's date in YYYY-MM-DD format for date inputs
  const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!title || !description || !startDate || !endDate) {
      setFormError('Title, description, start date, and end date are required');
      return;
    }
    
    const today = new Date(getTodayDateString());
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start < today) {
      setFormError('Start date cannot be in the past');
      return;
    }
    
    if (end < today) {
      setFormError('End date cannot be in the past');
      return;
    }

    if (end <= start) {
      setFormError('End date must be after start date');
      return;
    }

    // Process invited users into an array
    const invitedUsersArray = invitedUsers
      .split(',')
      .map(username => username.trim())
      .filter(username => username !== '');

    try {
      const res = await fetch('http://localhost:3000/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          startDate,
          endDate,
          invitedUsers: invitedUsersArray
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      onSubmitSuccess();
      onClose();
    } catch (err) {
      setFormError('Failed to create meeting. Please try again.');
      console.error(err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%'
      }}>
        <h2>Schedule Meeting</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Title:</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Start Date:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              min={getTodayDateString()}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>End Date:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              min={startDate || getTodayDateString()}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Invite Users (comma-separated):</label>
            <input 
              type="text" 
              value={invitedUsers} 
              onChange={e => setInvitedUsers(e.target.value)}
              placeholder="username1, username2, ..."
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          {formError && <div style={{ color: 'red', marginBottom: '15px' }}>{formError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ 
                marginRight: '10px', 
                padding: '8px 16px', 
                backgroundColor: '#f0f0f0', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer' 
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
