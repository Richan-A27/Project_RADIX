import React from 'react';
import { useRadixState } from '../state/StateEngine';
import type { ViewName } from '../state/StateEngine';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, apiKey, setApiKey, clearAll } = useRadixState();

  const menuItems: { name: ViewName; label: string; icon: string }[] = [
    { name: 'dashboard', label: 'Dashboard', icon: '⚡' },
    { name: 'jd-analytics', label: 'JD Analytics', icon: '📝' },
    { name: 'resume-parser', label: 'Resume Parser', icon: '👤' },
    { name: 'profile-builder', label: 'Profile Builder', icon: '🛠️' },
    { name: 'talent-check', label: 'Talent Check', icon: '📊' },
    { name: 'skill-matching', label: 'Skill Matching', icon: '🎯' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">R</div>
        <div>
          <span className="logo-text">RADIX Match</span>
          <span className="logo-badge">v1.0</span>
        </div>
      </div>

      <ul className="nav-links">
        {menuItems.map((item) => (
          <li key={item.name}>
            <button
              onClick={() => setCurrentView(item.name)}
              className={`nav-item ${currentView === item.name ? 'active' : ''}`}
              style={{
                width: '100%',
                background: 'none',
                textAlign: 'left',
                border: currentView === item.name ? undefined : 'none',
              }}
            >
              <span style={{ marginRight: '8px' }}>{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '20px', padding: '10px 0' }}>
        <button
          onClick={clearAll}
          className="btn-demo"
          style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
        >
          🗑️ Clear All State
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="api-key-config">
          <label htmlFor="api-key-input">Gemini API Key</label>
          <input
            id="api-key-input"
            type="password"
            className="api-key-input"
            placeholder="sk-or-gemini-key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.2' }}>
            {apiKey ? 'Using custom key' : 'No key: Using simulated mode'}
          </span>
        </div>
      </div>
    </aside>
  );
};
