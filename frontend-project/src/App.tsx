import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import MeetingInfo from './MeetingInfo';
import CalendarWithHourModal from './components/CalendarWithHourModal';

const App: React.FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/currentUser', {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (e) {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleLogout = async () => {
    await fetch('http://localhost:3000/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            authenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <div className="app-container" style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
                <div className="auth-toggle" style={{ 
                  display: 'flex', 
                  marginBottom: '20px',
                  width: '100%' 
                }}>
                  <button 
                    onClick={() => setShowRegister(false)} 
                    disabled={!showRegister}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: !showRegister ? '#239AE4' : '#f1f1f1',
                      color: !showRegister ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '4px 0 0 4px',
                      cursor: 'pointer',
                      fontWeight: !showRegister ? 'bold' : 'normal'
                    }}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setShowRegister(true)} 
                    disabled={showRegister}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: showRegister ? '#239AE4' : '#f1f1f1',
                      color: showRegister ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '0 4px 4px 0',
                      cursor: 'pointer',
                      fontWeight: showRegister ? 'bold' : 'normal'
                    }}
                  >
                    Register
                  </button>
                </div>
                {showRegister ? (
                  <Register onAuthSuccess={() => setAuthenticated(true)} />
                ) : (
                  <Login onAuthSuccess={() => setAuthenticated(true)} />
                )}
              </div>
            )
          } 
        />
        <Route 
          path="/home" 
          element={authenticated ? (
            <div>
              <Home onLogout={handleLogout} />
            </div>
          ) : <Navigate to="/" replace />} 
        />
        <Route 
          path="/meeting/:id" 
          element={authenticated ? <MeetingInfo /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
