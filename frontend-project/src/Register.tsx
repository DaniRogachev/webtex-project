import * as React from 'react';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Register: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    
    if (!validatePassword(password)) {
      return;
    }
    
    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Register</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            if (e.target.value) validatePassword(e.target.value);
          }}
          style={{
            padding: '10px', 
            borderRadius: '4px', 
            border: passwordError ? '1px solid #f44336' : '1px solid #ccc'
          }}
          required
        />
        {passwordError && <div style={{ color: '#f44336', fontSize: '14px' }}>{passwordError}</div>}
        <button 
          type="submit" 
          style={{ 
            padding: '10px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px',
            fontSize: '16px'
          }}
        >
          Register
        </button>
        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: '10px' }}>Registration successful! You can now log in.</div>}
      </form>
    </div>
  );
};

export default Register;
