import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    // If we were opened from a "reset your password" email link
    // (/reset-password?token=...), show the reset screen instead of login.
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (window.location.pathname === '/reset-password' && tokenFromUrl) {
      setResetToken(tokenFromUrl);
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleResetDone = () => {
    setResetToken(null);
    window.history.replaceState({}, '', '/');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="app">
      {resetToken ? (
        <ResetPassword token={resetToken} onDone={handleResetDone} />
      ) : !user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
