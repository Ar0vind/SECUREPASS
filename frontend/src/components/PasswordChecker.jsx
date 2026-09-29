import React, { useState } from 'react';
import './PasswordChecker.css';
import CryptoJS from 'crypto-js';
import { logHistory } from '../utils/api';

function PasswordChecker({ token }) {
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const checkPassword = async () => {
    if (!password) {
      setResult({ error: 'Please enter a password' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Hash the password with SHA-1 (HIBP uses SHA-1)
      const hash = CryptoJS.SHA1(password).toString().toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Call Have I Been Pwned API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();

      // Check if our hash suffix exists in the response
      const hashes = text.split('\n');
      const found = hashes.find(line => line.startsWith(suffix));

      if (found) {
        const count = parseInt(found.split(':')[1]);
        setResult({
          breached: true,
          count: count,
          message: `This password has been seen ${count.toLocaleString()} times in data breaches!`
        });
        // Log only the outcome (breached + count) to history — never the password itself.
        logHistory(token, { action: 'breach_check', breached: true, breachCount: count });
      } else {
        setResult({
          breached: false,
          message: 'Good news! This password has not been found in any known data breaches.'
        });
        logHistory(token, { action: 'breach_check', breached: false });
      }
    } catch (error) {
      setResult({ error: 'Failed to check password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-checker">
      <div className="tool-header">
        <h3>Check Password Security</h3>
        <p>See if your password has been compromised in data breaches</p>
      </div>

      <div className="checker-form">
        <div className="password-input-group">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to check"
            onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
          />
          <button 
            className="toggle-visibility"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        <button 
          onClick={checkPassword} 
          className="check-btn"
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Password'}
        </button>
      </div>

      {result && (
        <div className={`result-card ${result.breached ? 'danger' : result.error ? 'error' : 'success'}`}>
          {result.error ? (
            <div className="result-content">
              <span className="result-icon">⚠️</span>
              <p>{result.error}</p>
            </div>
          ) : result.breached ? (
            <div className="result-content">
              <span className="result-icon">🚨</span>
              <div>
                <h4>Password Compromised!</h4>
                <p>{result.message}</p>
                <p className="result-advice">We strongly recommend changing this password immediately.</p>
              </div>
            </div>
          ) : (
            <div className="result-content">
              <span className="result-icon">✅</span>
              <div>
                <h4>Password Secure</h4>
                <p>{result.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="info-box">
        <h4>How it works</h4>
        <p>We use the Have I Been Pwned API to check if your password appears in known data breaches. Your password is never sent to our servers - it's hashed locally in your browser for privacy.</p>
      </div>
    </div>
  );
}

export default PasswordChecker;
