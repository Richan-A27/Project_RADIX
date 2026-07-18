import React from 'react';
import { useRadixState } from '../state/StateEngine';

export const JDAnalytics: React.FC = () => {
  const { jdData, setCurrentView } = useRadixState();

  if (!jdData) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <h2>No Job Description Loaded</h2>
        <p style={{ marginTop: '8px', marginBottom: '24px', maxWidth: '400px' }}>
          Upload a Job Description PDF/DOCX on the dashboard to analyze its skillset requirements.
        </p>
        <button className="btn-submit" onClick={() => setCurrentView('dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Count skills by category code
  const categoryCounts = jdData.skills.reduce((acc, skill) => {
    acc[skill.category_code] = (acc[skill.category_code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="view-title">Job Description Analytics</h1>
            <p className="view-description">
              Classified capabilities matching the 12 RADIX categories from <strong>{jdData.source_file}</strong>
            </p>
          </div>
          <button className="btn-demo" onClick={() => setCurrentView('dashboard')}>
            ← Upload Another
          </button>
        </div>
      </div>

      {/* Role and Company Metadata Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          display: 'flex',
          gap: '40px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Company</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{jdData.company || 'Not Specified'}</h2>
        </div>
        <div style={{ width: '1px', backgroundColor: 'var(--border-color)' }}></div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Role</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px' }}>{jdData.role || 'Not Specified'}</h2>
        </div>
      </div>

      {/* Category distribution summary */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Category Distribution
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <span key={cat} className={`skill-category cat-${cat}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
              {cat}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Skills list grid */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Extracted Skillsets ({jdData.skills.length})
        </h3>
        
        <div className="skill-grid">
          {jdData.skills.map((skill, index) => (
            <div key={index} className="skill-card">
              <div className="skill-header">
                <span className="skill-name">{skill.skill_name}</span>
                <span className={`skill-category cat-${skill.category_code}`}>{skill.category_code}</span>
              </div>
              <div className="skill-header">
                <span className="skill-confidence">
                  Confidence:{' '}
                  <span className={`conf-${skill.confidence}`} style={{ fontWeight: 600 }}>
                    {skill.confidence.toUpperCase()}
                  </span>
                </span>
              </div>
              {skill.evidence && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Agent Justification Evidence:
                  </span>
                  <p className="skill-evidence">"{skill.evidence}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
