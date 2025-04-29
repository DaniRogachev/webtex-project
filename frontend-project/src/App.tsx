import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
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

  if (!authenticated) {
    return (
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
    );
  }

  const handleLogout = async () => {
    await fetch('http://localhost:3000/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setAuthenticated(false);
  };

  return (
    <div>
      <h1>Welcome to Meeting Scheduler!</h1>
      <p>You are logged in.</p>
      <CalendarWithHourModal />
      <button onClick={handleLogout} style={{ marginTop: '1rem' }}>Logout</button>
    </div>
  );
};

export default App;
