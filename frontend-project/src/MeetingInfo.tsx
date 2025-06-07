import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteResultsTable from './components/VoteResultsTable';

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

interface Vote {
  id: string;
  meetingId: string;
  username: string;
  date: string;
  hour: number;
  minute: number;
  createdAt: string;
}

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
  const [usernameToInvite, setUsernameToInvite] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchMeetingDetails();
  }, [id]);
  
  // Check if current user is the creator whenever username or meeting changes
  useEffect(() => {
    if (meeting && currentUsername) {
      setIsCreator(meeting.createdBy === currentUsername);
      console.log('Creator check:', { 
        meetingCreator: meeting.createdBy, 
        currentUser: currentUsername, 
        isCreator: meeting.createdBy === currentUsername 
      });
    }
  }, [meeting, currentUsername]);
  
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
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !usernameToInvite.trim()) {
      setInviteError('Please enter a username');
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
        body: JSON.stringify({ username: usernameToInvite.trim() }),
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      // Clear form and close modal
      setUsernameToInvite('');
      setShowInviteModal(false);
      
      // Refresh meeting details
      fetchMeetingDetails();
    } catch (err) {
      console.error('Error inviting user:', err);
      setInviteError('Failed to invite user. Please try again.');
    }
  };
  
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
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                <input 
                  type="text" 
                  value={usernameToInvite} 
                  onChange={e => setUsernameToInvite(e.target.value)}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
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
