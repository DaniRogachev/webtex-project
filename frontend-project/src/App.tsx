import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
        setLoading(true);
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

  // Instead of a separate handleLogout function, we'll handle logout directly in Home
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            authenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <div className="app-container">
                <div className="auth-toggle">
                  <button onClick={() => setShowRegister(false)} disabled={!showRegister}>Login</button>
                  <button onClick={() => setShowRegister(true)} disabled={showRegister}>Register</button>
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
          element={authenticated ? <Home setAuthenticated={setAuthenticated} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/meeting/:id" 
          element={authenticated ? <MeetingInfo /> : <Navigate to="/" replace />} 
        />
        {/* Add a catch-all route to redirect to home or login depending on auth state */}
        <Route 
          path="*" 
          element={authenticated ? <Navigate to="/home" replace /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
