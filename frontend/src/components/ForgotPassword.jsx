
import React, { useState } from 'react';
import './Auth.css';
import { API_URL } from '../utils/api';



function ForgotPassword({ onBackToLogin }) {
  console.log("🔥 forgotPassword() CALLED");
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // Debug: verify which backend URL the frontend is using
      console.log('API_URL:', API_URL);
      console.log(
        'Forgot Password URL:',
        `${API_URL}/auth/forgot-password`
      );

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Forgot Password Status:', response.status);

      const data = await response.json();

      console.log('Forgot Password Response:', data);

      if (response.ok) {
        setSubmitted(true);
        setMessage(
          data.message ||
            'If an account with that email exists, a reset link has been sent.'
        );
      } else {
        setIsError(true);
        setMessage(
          data.message || 'Something went wrong. Please try again.'
        );
      }
    } catch (err) {
      console.error('Forgot Password Error:', err);

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
          <p>Reset your password</p>
        </div>

        {submitted ? (
          <div className="auth-form">
            <div className="auth-message success">{message}</div>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              Didn't get an email? Check your spam folder, or try again with a
              different address.
            </p>

            <button
              type="button"
              className="back-to-login-link"
              onClick={onBackToLogin}
            >
              ← Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                autoFocus
              />
            </div>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              We'll send a link to reset your password if an account with that
              email exists.
            </p>

            {message && (
              <div
                className={`auth-message ${
                  isError ? 'error' : 'success'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>

            <button
              type="button"
              className="back-to-login-link"
              onClick={onBackToLogin}
            >
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;

