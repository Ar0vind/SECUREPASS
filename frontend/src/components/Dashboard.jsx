import React, { useState } from 'react';
import './Dashboard.css';
import PasswordChecker from './PasswordChecker';
import PasswordGenerator from './PasswordGenerator';
import History from './History';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('checker');

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>SecurePass</h2>
          <span className="user-info">Welcome, {user.username}</span>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="tool-tabs">
          <button 
            className={activeTab === 'checker' ? 'active' : ''}
            onClick={() => setActiveTab('checker')}
          >
            <span className="tab-icon">🔍</span>
            Password Leak Checker
          </button>
          <button 
            className={activeTab === 'generator' ? 'active' : ''}
            onClick={() => setActiveTab('generator')}
          >
            <span className="tab-icon">🔑</span>
            Password Generator
          </button>
          <button
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            <span className="tab-icon">📜</span>
            History
          </button>
        </div>

        <div className="tool-content">
          {activeTab === 'checker' && <PasswordChecker token={user.token} />}
          {activeTab === 'generator' && <PasswordGenerator token={user.token} />}
          {activeTab === 'history' && <History token={user.token} />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
