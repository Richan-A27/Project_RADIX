import React, { useState } from 'react';

function ResumeParser() {
  return (
    <div style={{ padding: '2rem' }}>
      <header className="app-header">
        <div className="app-title-badge">RADIX Integrated Portal</div>
        <h1 className="app-title">Resume Parser (Role 2)</h1>
        <p className="app-subtitle">
          Upload a resume to automatically extract skills and map them to the RADIX taxonomy.
        </p>
      </header>
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>This module is currently being integrated into the unified API. Please run <code>python parser.py</code> in the Role 2 folder for CLI parsing.</p>
      </div>
    </div>
  );
}

export default ResumeParser;
