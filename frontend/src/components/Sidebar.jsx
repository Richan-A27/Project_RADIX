import React from 'react';

function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'talent', icon: 'fa-network-wired', label: 'Talent Match (Role 5)' },
    { id: 'profile', icon: 'fa-user-plus', label: 'Profile Builder (Role 3)' },
    { id: 'jd', icon: 'fa-briefcase', label: 'JD Analytics (Role 1)' },
    { id: 'resume', icon: 'fa-file-lines', label: 'Resume Parser (Role 2)' }
  ];

  return (
    <div style={{
      width: '260px',
      background: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem'
    }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px', 
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: 'white', fontWeight: 'bold'
        }}>R</div>
        <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>RADIX Hub</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: activePage === item.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activePage === item.id ? '#c7d2fe' : '#94a3b8',
              border: activePage === item.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
              fontWeight: activePage === item.id ? '600' : '400'
            }}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
