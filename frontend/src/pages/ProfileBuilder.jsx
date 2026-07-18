import React from 'react';

function ProfileBuilder() {
  return (
    <div style={{ padding: '2rem', height: '100%' }}>
      <iframe 
        src="http://127.0.0.1:5000" 
        style={{ width: '100%', height: '80vh', border: 'none', borderRadius: '16px' }}
        title="Profile Builder"
      />
    </div>
  );
}

export default ProfileBuilder;
