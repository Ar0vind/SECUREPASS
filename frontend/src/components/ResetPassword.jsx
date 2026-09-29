import React, { useState } from 'react';
import './Auth.css';
import { API_URL } from '../utils/api';

function ResetPassword({ token, onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message || 'Password reset successful. You can now log in.');
      } else {
        setIsError(true);
        setMessage(data.message || 'That reset link is invalid or has expired.');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-backdrop"></div>
      <div className="auth-card">
        <div className="auth-header">
          <h1>SecurePass</h1>
          <p>Choose a new password</p>
        </div>

        {success ? (
          <div className="auth-form">
            <div className="auth-message success">{message}</div>
            <button type="button" className="submit-btn" onClick={onDone}>
              Go to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter a new password"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter the new password"
              />
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Must be at least 8 characters with uppercase, lowercase, a number, and a special character (@$!%*?&).
            </p>

            {message && (
              <div className={`auth-message ${isError ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>

            <button type="button" className="back-to-login-link" onClick={onDone}>
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
