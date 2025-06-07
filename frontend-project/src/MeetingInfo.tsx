import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteResultsTable from './components/VoteResultsTable';
import CalendarWithHourModal, { Vote as VoteType } from './components/CalendarWithHourModal';

interface Participator {
  username: string;
  status: 'invited' | 'accepted' | 'declined';
  responded_at?: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  participators: Participator[];
}

// We'll use the VoteType from CalendarWithHourModal component
type Vote = VoteType;

interface VoteResult {
  date: string;
  hour: number;
  minute: number;
  count: number;
}

interface MeetingResponse {
  meeting: Meeting;
  votes: Vote[];
  results: VoteResult[];
}

const MeetingInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [isCreator, setIsCreator] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // References for handling clicks outside suggestion dropdown
  const suggestionsRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [userStatus, setUserStatus] = useState<'accepted' | 'invited' | 'declined' | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchMeetingDetails();
    fetchAvailableUsers();
  }, [id]);
  
  // Check if current user is the creator and get participation status whenever username or meeting changes
  useEffect(() => {
    if (meeting && currentUsername) {
      setIsCreator(meeting.createdBy === currentUsername);
      
      // Find user status in participants
      const userParticipation = meeting.participators.find(p => p.username === currentUsername);
      if (userParticipation) {
        setUserStatus(userParticipation.status as 'accepted' | 'invited' | 'declined');
      } else {
        setUserStatus(null);
      }
      
      console.log('User details:', { 
        meetingCreator: meeting.createdBy, 
        currentUser: currentUsername, 
        isCreator: meeting.createdBy === currentUsername,
        userStatus: userParticipation?.status
      });
      
      // Filter votes for current user
      if (votes.length > 0) {
        const currentUserVotes = votes.filter(vote => vote.username === currentUsername);
        setUserVotes(currentUserVotes);
      }
    }
  }, [meeting, currentUsername, votes]);
  
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/currentUser', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/');
          return;
        }
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      setCurrentUsername(data.username);
    } catch (err) {
      console.error('Failed to fetch current user', err);
    }
  };
  
  const fetchMeetingDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/meetings/${id}/votes`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/');
          return;
        } else if (res.status === 404) {
          throw new Error('Meeting not found');
        } else {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }
      
      const data: MeetingResponse = await res.json();
      setMeeting(data.meeting);
      setVotes(data.votes);
      setResults(data.results);
      setError(null);
      
      // Note: We now handle the creator check in a separate useEffect
      
      // Extract user votes
      if (votes.length > 0 && currentUsername) {
        const currentUserVotes = votes.filter(vote => vote.username === currentUsername);
        setUserVotes(currentUserVotes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load meeting details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const handleDeleteMeeting = async () => {
    if (!id) return;
    
    try {
      const res = await fetch(`http://localhost:3000/api/meetings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      navigate('/home');
    } catch (err) {
      console.error('Error deleting meeting:', err);
      alert('Failed to delete meeting. Please try again.');
    }
  };
  
  const handleRemoveParticipant = async (username: string) => {
    if (!id) return;
    
    try {
      const res = await fetch(`http://localhost:3000/api/meetings/${id}/participants`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username }),
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      // Refresh meeting details
      fetchMeetingDetails();
    } catch (err) {
      console.error('Error removing participant:', err);
      alert('Failed to remove participant. Please try again.');
    }
  };
  
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
  
  // Effect to handle clicks outside the suggestion dropdown
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
  
  // Filter available users based on search input
  const getFilteredUsers = () => {
    if (!userSearch.trim()) return [];
    
    return availableUsers
      .filter(user => 
        user.toLowerCase().includes(userSearch.toLowerCase()) && 
        // Don't show users who are already participants
        !meeting?.participators.some(p => p.username === user)
      )
      .slice(0, 5); // Limit to 5 suggestions for better UI
  };
  
  // Handle the form submission to invite the user
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = userSearch;
    if (!id || !username.trim()) {
      setInviteError('Please enter a username');
      return;
    }
    
    const trimmedUsername = username.trim();
    
    // Validate that the user exists
    if (!availableUsers.includes(trimmedUsername)) {
      setInviteError(`User '${trimmedUsername}' does not exist`);
      return;
    }
    
    // Check if user is already a participant
    if (meeting?.participators.some(p => p.username === trimmedUsername)) {
      setInviteError(`User '${trimmedUsername}' is already invited to this meeting`);
      return;
    }
    
    try {
      setInviteError(null);
      const res = await fetch(`http://localhost:3000/api/meetings/${id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: trimmedUsername }),
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      // Clear form and close modal
      setUserSearch('');
      setShowSuggestions(false);
      setShowInviteModal(false);
      
      // Refresh meeting details
      fetchMeetingDetails();
    } catch (err) {
      console.error('Error inviting user:', err);
      setInviteError('Failed to invite user. Please try again.');
    }
  };
  
  // No longer need separate submitInviteForm function
  
  const getParticipatorStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#4CAF50';
      case 'declined':
        return '#f44336';
      case 'invited':
        return '#2196F3';
      default:
        return '#000';
    }
  };

  if (loading) {
    return (
      <div className="meeting-info" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2>Loading meeting details...</h2>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="meeting-info" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error || 'Meeting not found'}</p>
        <Link 
          to="/home"
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px',
            marginTop: '15px'
          }}
        >
          Back to Meetings
        </Link>
      </div>
    );
  }

  return (
    <div className="meeting-info" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{meeting.title}</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isCreator && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#f44336', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px', 
                cursor: 'pointer'
              }}
            >
              Delete Meeting
            </button>
          )}
          <Link 
            to="/home"
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '4px' 
            }}
          >
            Back to Meetings
          </Link>
        </div>
      </div>

      <div className="meeting-details" style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px' 
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ marginBottom: '5px' }}>Description</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{meeting.description}</p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ marginBottom: '5px' }}>Created By</h3>
          <p>{meeting.createdBy}</p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ marginBottom: '5px' }}>Time Range</h3>
          <p>{formatDate(meeting.startDate)} - {formatDate(meeting.endDate)}</p>
        </div>

        <div>
          <h3 style={{ marginBottom: '5px' }}>Created At</h3>
          <p>{new Date(meeting.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Voting Section */}
      <div className="voting-section" style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Your Votes</h2>
          {userStatus === 'accepted' && (
            <button
              onClick={() => setShowVotingModal(!showVotingModal)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#2196F3', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px', 
                cursor: 'pointer'
              }}
            >
              {showVotingModal ? 'Hide Voting' : 'Vote for Times'}
            </button>
          )}
        </div>
        
        {userStatus !== 'accepted' ? (
          <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '4px', borderLeft: '4px solid #ff9800' }}>
            <p style={{ margin: '0' }}>
              <strong>Note:</strong> You need to accept the invitation to this meeting before you can vote for times.
              {userStatus === 'invited' && ' Please check your invitations on the home page.'}
              {userStatus === 'declined' && ' You previously declined this meeting. Please contact the organizer if you want to participate.'}
            </p>
          </div>
        ) : showVotingModal && meeting ? (
          <CalendarWithHourModal
            startDate={meeting.startDate}
            endDate={meeting.endDate}
            meetingId={meeting.id}
            onVoteSuccess={fetchMeetingDetails}
            existingVotes={userVotes}
          />
        ) : (
          <div>
            {userVotes.length > 0 ? (
              <div>
                <p>You have voted for the following times:</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {userVotes.map(vote => (
                    <li key={vote.id} style={{ marginBottom: '10px', padding: '10px', borderRadius: '4px', backgroundColor: '#e3f2fd' }}>
                      {new Date(vote.date).toLocaleDateString()} at {vote.hour.toString().padStart(2, '0')}:{vote.minute.toString().padStart(2, '0')}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>You haven't voted for any times yet. Click 'Vote for Times' to add your availability.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Participants Section */}
      <div className="participants-section" style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Participants</h2>
          {isCreator && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none',
                borderRadius: '4px', 
                cursor: 'pointer'
              }}
            >
              Invite User
            </button>
          )}
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Username</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Response Time</th>
              {isCreator && (
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {meeting.participators.map(participant => (
              <tr key={participant.username}>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  {participant.username} {participant.username === currentUsername ? '(You)' : ''}
                </td>
                <td style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #ddd',
                  color: getParticipatorStatusColor(participant.status)
                }}>
                  {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                  {participant.responded_at ? new Date(participant.responded_at).toLocaleString() : '-'}
                </td>
                {isCreator && (
                  <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                    {participant.username !== meeting.createdBy && (
                      <button
                        onClick={() => handleRemoveParticipant(participant.username)}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#f44336', 
                          color: 'white', 
                          border: 'none',
                          borderRadius: '4px', 
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vote Results Section */}
      <div className="vote-results-section" style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Vote Results</h2>
        <VoteResultsTable results={results} />
      </div>
      
      {/* Delete Meeting Confirmation Modal */}
      {showDeleteConfirm && (
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
            <h2>Delete Meeting</h2>
            <p>Are you sure you want to delete this meeting? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
                onClick={handleDeleteMeeting}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#f44336', 
                  color: 'white', 
                  border: 'none',
                  borderRadius: '4px', 
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Invite User Modal */}
      {showInviteModal && (
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
            <h2>Invite User</h2>
            <form onSubmit={handleInviteUser}>
              <div style={{ marginBottom: '15px', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Search for a user:</label>
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
                      top: 'calc(100% + 10px)', /* Add 10px space between tags and dropdown */
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
                          onClick={() => {
                            setUserSearch(user);
                            setShowSuggestions(false);
                          }}
                          onMouseDown={(e) => e.preventDefault()} // Prevent blur from closing dropdown
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
              </div>
              {inviteError && <div style={{ color: 'red', marginBottom: '15px' }}>{inviteError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
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
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingInfo;
