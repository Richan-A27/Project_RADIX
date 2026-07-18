import React from 'react';
import { useRadixState } from '../state/StateEngine';

export const ResumeParser: React.FC = () => {
  const { resumeData, profileData, setCurrentView } = useRadixState();

  if (!resumeData || !profileData) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
        <h2>No Resume Loaded</h2>
        <p style={{ marginTop: '8px', marginBottom: '24px', maxWidth: '400px' }}>
          Upload a candidate CV/Resume PDF on the dashboard to trigger the extraction pipeline.
        </p>
        <button className="btn-submit" onClick={() => setCurrentView('dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="view-title">CV Extraction Engine</h1>
            <p className="view-description">
              Agent extraction metadata and skill matrices mapped from <strong>{resumeData.source_file}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-demo" onClick={() => setCurrentView('dashboard')}>
              ← Upload Another
            </button>
            <button className="btn-submit" onClick={() => setCurrentView('profile-builder')}>
              🛠️ Edit in Profile Builder
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Profile Summary card */}
      <div className="profile-form-container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{profileData.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>✉ {profileData.email}</p>
            
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Education</span>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{profileData.education}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Internships & Roles</span>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {profileData.internships.map((intern, i) => (
                    <li key={i} style={{ fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      💼 {intern}
                    </li>
                  ))}
                  {profileData.internships.length === 0 && <li style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None listed</li>}
                </ul>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Hackathons & Awards</span>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {profileData.hackathons.map((hack, i) => (
                    <li key={i} style={{ fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      🏆 {hack}
                    </li>
                  ))}
                  {profileData.hackathons.length === 0 && <li style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None listed</li>}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '32px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Certifications</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profileData.certifications.map((cert, i) => (
                <span key={i} style={{ fontSize: '12px', background: 'var(--accent-glow)', border: '1px solid rgba(59, 130, 246, 0.3)', color: 'var(--accent-hover)', padding: '6px 12px', borderRadius: '4px', display: 'inline-block' }}>
                  🗂️ {cert}
                </span>
              ))}
              {profileData.certifications.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None listed</span>}
            </div>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginTop: '20px', marginBottom: '8px' }}>Preferred Roles</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {profileData.preferred_roles.map((role, i) => (
                <span key={i} style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px' }}>
                  🎯 {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Skills List */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Extracted Competency Matrix ({profileData.skills.length})
        </h3>
        
        <div className="skill-grid">
          {profileData.skills.map((skill, index) => (
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
                    Agent Context Evidence:
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
