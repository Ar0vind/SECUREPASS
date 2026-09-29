import React, { useState } from 'react';
import './PasswordGenerator.css';
import { logHistory } from '../utils/api';

const computeStrength = (password) => {
  if (!password) return { level: 0, text: '' };

  let strength = 0;
  if (password.length >= 12) strength += 25;
  if (password.length >= 16) strength += 25;
  if (/[a-z]/.test(password)) strength += 12.5;
  if (/[A-Z]/.test(password)) strength += 12.5;
  if (/[0-9]/.test(password)) strength += 12.5;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

  if (strength < 40) return { level: strength, text: 'Weak', color: '#ef4444' };
  if (strength < 70) return { level: strength, text: 'Moderate', color: '#f59e0b' };
  return { level: strength, text: 'Strong', color: '#10b981' };
};

function PasswordGenerator({ token }) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = '';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      setPassword('');
      return;
    }

    let newPassword = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length];
    }

    setPassword(newPassword);
    setCopied(false);

    // Log only the length/options/strength used — never the generated password itself.
    const { text: strengthText } = computeStrength(newPassword);
    logHistory(token, {
      action: 'password_generated',
      length,
      options,
      strength: strengthText,
    });
  };

  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOptionChange = (option) => {
    setOptions({
      ...options,
      [option]: !options[option],
    });
  };

  const calculateStrength = () => computeStrength(password);

  const strength = calculateStrength();

  return (
    <div className="password-generator">
      <div className="tool-header">
        <h3>Generate Secure Password</h3>
        <p>Create strong, random passwords for your accounts</p>
      </div>

      <div className="generator-output">
        <div className="password-display">
          <input
            type="text"
            value={password}
            readOnly
            placeholder="Click generate to create password"
          />
          <button 
            onClick={copyToClipboard} 
            className="copy-btn"
            disabled={!password}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>

        {password && (
          <div className="strength-meter">
            <div className="strength-bar">
              <div 
                className="strength-fill" 
                style={{ width: `${strength.level}%`, backgroundColor: strength.color }}
              ></div>
            </div>
            <span style={{ color: strength.color }}>{strength.text}</span>
          </div>
        )}
      </div>

      <div className="generator-options">
        <div className="length-control">
          <label>
            Password Length: <strong>{length}</strong>
          </label>
          <input
            type="range"
            min="8"
            max="32"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
          />
        </div>

        <div className="options-grid">
          <label className="option-item">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => handleOptionChange('uppercase')}
            />
            <span>Uppercase (A-Z)</span>
          </label>

          <label className="option-item">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => handleOptionChange('lowercase')}
            />
            <span>Lowercase (a-z)</span>
          </label>

          <label className="option-item">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => handleOptionChange('numbers')}
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="option-item">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => handleOptionChange('symbols')}
            />
            <span>Symbols (!@#$...)</span>
          </label>
        </div>
      </div>

      <button onClick={generatePassword} className="generate-btn">
        Generate Password
      </button>

      <div className="info-box">
        <h4>Password Tips</h4>
        <ul>
          <li>Use at least 12 characters for better security</li>
          <li>Include a mix of uppercase, lowercase, numbers, and symbols</li>
          <li>Avoid using personal information</li>
          <li>Use a unique password for each account</li>
        </ul>
      </div>
    </div>
  );
}

export default PasswordGenerator;
