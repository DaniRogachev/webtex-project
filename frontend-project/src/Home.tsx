import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CreateMeetingModal from './components/CreateMeetingModal';

interface Participator {
  username: string;
  status: 'invited' | 'accepted' | 'declined';
  responded_at?: string;
}

interface HomeProps {
  onLogout: () => Promise<void>;
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

const Home: React.FC<HomeProps> = ({ onLogout }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [invites, setInvites] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [currentUsername, setCurrentUsername] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
    fetchMeetings();
    fetchInvites();
  }, []);
  
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

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/meetings', {
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
      setMeetings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load meetings. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInvites = async () => {
    try {
      setInvitesLoading(true);
      const res = await fetch('http://localhost:3000/api/meetings/invited', {
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
      setInvites(data);
      setInvitesError(null);
    } catch (err) {
      setInvitesError('Failed to load invites. Please try again later.');
      console.error(err);
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleLogout = async () => {
    await onLogout();
  };

  const handleRespondToInvite = async (meetingId: string, accept: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/api/meetings/${meetingId}/respond-to-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reply: accept ? 'accept' : 'decline'
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      fetchInvites();
      fetchMeetings();
    } catch (err) {
      console.error('Failed to respond to invite', err);
      alert('Failed to respond to the invitation. Please try again.');
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  return (
    <div className="home-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Meeting Scheduler</h1>
        <div>
          <button 
            onClick={() => setShowModal(true)} 
            style={{ 
              marginRight: '10px', 
              padding: '8px 16px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer' 
            }}
          >
            Schedule Meeting
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer' 
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {loading ? (
        <p>Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <p>No meetings scheduled yet. Create your first meeting!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Title</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Owner</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time Range</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map(meeting => (
              <tr key={meeting.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{meeting.title}</td>
                <td style={{ padding: '12px' }}>{meeting.createdBy}</td>
                <td style={{ padding: '12px' }}>{formatDateRange(meeting.startDate, meeting.endDate)}</td>
                <td style={{ padding: '12px' }}>
                  <Link 
                    to={`/meeting/${meeting.id}`}
                    style={{ 
                      padding: '6px 12px', 
                      backgroundColor: '#2196F3', 
                      color: 'white', 
                      borderRadius: '4px', 
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for creating meeting */}
      {showModal && (
        <CreateMeetingModal 
          onClose={() => setShowModal(false)} 
          onSubmitSuccess={fetchMeetings} 
        />
      )}
      
      {/* Invites Section */}
      <div style={{ marginTop: '40px' }}>
        <h2>Meeting Invitations</h2>
        {invitesError && <div style={{ color: 'red', marginBottom: '20px' }}>{invitesError}</div>}
        
        {invitesLoading ? (
          <p>Loading invitations...</p>
        ) : invites.length === 0 ? (
          <p>You don't have any pending invitations.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Title</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Owner</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Time Range</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(meeting => (
                <tr key={meeting.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px' }}>{meeting.title}</td>
                  <td style={{ padding: '12px' }}>{meeting.createdBy}</td>
                  <td style={{ padding: '12px' }}>{formatDateRange(meeting.startDate, meeting.endDate)}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Link 
                        to={`/meeting/${meeting.id}`}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#2196F3', 
                          color: 'white', 
                          borderRadius: '4px', 
                          textDecoration: 'none',
                        }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleRespondToInvite(meeting.id, true)}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#4CAF50', 
                          color: 'white', 
                          border: 'none',
                          borderRadius: '4px', 
                          cursor: 'pointer'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToInvite(meeting.id, false)}
                        style={{ 
                          padding: '6px 12px', 
                          backgroundColor: '#f44336', 
                          color: 'white', 
                          border: 'none',
                          borderRadius: '4px', 
                          cursor: 'pointer'
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Home;
