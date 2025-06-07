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
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Reference for handling clicks outside the suggestion dropdown
  const suggestionsRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    fetchAvailableUsers();
  }, []);
  
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const users: string[] = await res.json();
      setAvailableUsers(users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Function to get today's date in YYYY-MM-DD format for date inputs
  const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const getFilteredUsers = () => {
    if (!userSearch.trim()) return [];
    
    return availableUsers
      .filter(user => 
        user.toLowerCase().includes(userSearch.toLowerCase()) && 
        !selectedUsers.includes(user)
      )
      .slice(0, 5);
  };
  
  const addUser = (username: string) => {
    if (!username.trim() || selectedUsers.includes(username)) return;
    
    if (!availableUsers.includes(username)) {
      setFormError(`User '${username}' does not exist`);
      return;
    }
    
    setSelectedUsers([...selectedUsers, username]);
    setUserSearch('');
    setShowSuggestions(false);
    setFormError(null);
    
    // Focus back on the search input after adding a user
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const removeUser = (username: string) => {
    setSelectedUsers(selectedUsers.filter(user => user !== username));
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

    if (end < start) {
      setFormError('End date cannot be before start date');
      return;
    }

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
          invitedUsers: selectedUsers
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
          <div style={{ marginBottom: '15px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Invite Users:</label>
            <input 
              ref={searchInputRef}
              type="text" 
              value={userSearch}
              onChange={e => {
                setUserSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Type to search for users..."
              style={{ 
                width: '100%', 
                padding: '8px', 
                boxSizing: 'border-box',
                borderRadius: '4px',
                border: '1px solid #ddd',
                marginBottom: '5px' /* Add small space between input and tags */
              }}
            />
            
            {/* User suggestions dropdown */}
            {showSuggestions && (
              <div 
                ref={suggestionsRef}
                style={{ 
                  position: 'absolute', 
                  zIndex: 100,
                  top: 'calc(100% + 10px)', 
                  left: 0, 
                  right: 0,
                  backgroundColor: 'white', 
                  border: '1px solid #ddd',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {getFilteredUsers().length > 0 ? (
                  getFilteredUsers().map(user => (
                    <div 
                      key={user} 
                      onClick={() => addUser(user)}
                      onMouseDown={(e) => e.preventDefault()}
                      style={{ 
                        padding: '10px', 
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {user}
                    </div>
                  ))
                ) : userSearch.trim() ? (
                  <div style={{ padding: '10px', color: '#666', fontStyle: 'italic' }}>
                    No matching users found
                  </div>
                ) : null}
              </div>
            )}
            
            {/* Selected users chips */}
            <div style={{ 
              marginTop: '5px', 
              marginBottom: '10px', 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {selectedUsers.map(user => (
                <div 
                  key={user} 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#e3f2fd', 
                    color: '#1976d2',
                    padding: '4px 8px 4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px'
                  }}
                >
                  {user}
                  <button 
                    type="button" 
                    onClick={() => removeUser(user)} 
                    style={{ 
                      marginLeft: '5px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#1976d2',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedUsers.length === 0 && (
                <div style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                  No users selected. Search and select users to invite.
                </div>
              )}
            </div>
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
