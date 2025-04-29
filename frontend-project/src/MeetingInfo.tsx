import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

interface Meeting {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
}

const MeetingInfo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        
        const data = await res.json();
        setMeeting(data.meeting);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load meeting details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingDetails();
  }, [id, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
    </div>
  );
};

export default MeetingInfo;
