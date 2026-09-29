import React, { useState, useEffect } from 'react';
import './History.css';
import { API_URL } from '../utils/api';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'breach_check', label: 'Checks' },
  { key: 'password_generated', label: 'Generated' },
];

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function HistoryEntry({ entry }) {
  if (entry.action === 'breach_check') {
    return (
      <div className={`history-item ${entry.breached ? 'danger' : 'success'}`}>
        <span className="history-icon">{entry.breached ? '🚨' : '✅'}</span>
        <div className="history-item-body">
          <p className="history-item-title">
            {entry.breached
              ? `Password checked — found in ${entry.breachCount?.toLocaleString() ?? 'a'} breach${entry.breachCount === 1 ? '' : 'es'}`
              : 'Password checked — no breaches found'}
          </p>
          <span className="history-item-time">{formatDate(entry.createdAt)}</span>
        </div>
      </div>
    );
  }

  const optionLabels = { uppercase: 'A-Z', lowercase: 'a-z', numbers: '0-9', symbols: 'symbols' };
  const usedOptions = Object.entries(entry.options || {})
    .filter(([, enabled]) => enabled)
    .map(([key]) => optionLabels[key])
    .join(', ');

  return (
    <div className="history-item neutral">
      <span className="history-icon">🔑</span>
      <div className="history-item-body">
        <p className="history-item-title">
          Generated a {entry.length}-character password
          {entry.strength ? <span className={`strength-tag strength-${entry.strength.toLowerCase()}`}> {entry.strength}</span> : null}
        </p>
        {usedOptions && <p className="history-item-sub">{usedOptions}</p>}
        <span className="history-item-time">{formatDate(entry.createdAt)}</span>
      </div>
    </div>
  );
}

function History({ token }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setEntries(data);
      } else {
        setError(data.message || 'Failed to load history');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleClear = async () => {
    if (!window.confirm('Clear all activity history? This cannot be undone.')) return;
    setClearing(true);
    try {
      const response = await fetch(`${API_URL}/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setEntries([]);
      }
    } catch (err) {
      // no-op — the list simply won't clear; user can retry
    } finally {
      setClearing(false);
    }
  };

  const visibleEntries = entries.filter((e) => filter === 'all' || e.action === filter);

  return (
    <div className="history-panel">
      <div className="tool-header">
        <h3>Account History</h3>
        <p>A record of your password checks and generated passwords — never the passwords themselves</p>
      </div>

      <div className="history-controls">
        <div className="history-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          className="clear-history-btn"
          onClick={handleClear}
          disabled={clearing || entries.length === 0}
        >
          {clearing ? 'Clearing...' : 'Clear history'}
        </button>
      </div>

      {loading ? (
        <div className="history-empty">Loading history...</div>
      ) : error ? (
        <div className="history-empty error">{error}</div>
      ) : visibleEntries.length === 0 ? (
        <div className="history-empty">
          {entries.length === 0
            ? 'No activity yet — check or generate a password to see it here.'
            : 'Nothing matches this filter yet.'}
        </div>
      ) : (
        <div className="history-list">
          {visibleEntries.map((entry) => (
            <HistoryEntry key={entry._id} entry={entry} />
          ))}
        </div>
      )}

      <div className="info-box">
        <h4>What we store</h4>
        <p>
          To keep your passwords secure, we only ever log metadata — whether a checked password was
          breached (and how many times), or the length and character options of a generated password.
          The passwords themselves are never sent to or stored on our servers.
        </p>
      </div>
    </div>
  );
}

export default History;
