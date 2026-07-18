import React from 'react';
import { useRadixState } from '../state/StateEngine';

export const SkillMatching: React.FC = () => {
  const {
    jdData,
    profileData,
    semanticMatchReport,
    executeSemanticMatch,
    loadingStates,
    setCurrentView
  } = useRadixState();

  const handleMatch = async () => {
    await executeSemanticMatch();
  };

  const isJdLoaded = !!jdData;
  const isProfileLoaded = !!profileData;

  if (!isJdLoaded || !isProfileLoaded) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
        <h2>Data Requirements Missing</h2>
        <p style={{ marginTop: '8px', marginBottom: '24px', maxWidth: '500px' }}>
          Semantic Skill Matching requires both a <strong>Job Description</strong> and an active <strong>Candidate Profile</strong>.
          Please upload both on the dashboard first.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-submit" onClick={() => setCurrentView('dashboard')}>
            Go to Dashboard
          </button>
          <button className="btn-demo" onClick={() => setCurrentView('dashboard')}>
            Load Demo Presets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header">
        <h1 className="view-title">Semantic Skill Matching</h1>
        <p className="view-description">
          Conceptual matching of unstructured CV skill sets against JD requirements using generative AI fuzzy semantic models.
        </p>
      </div>

      {/* Matching trigger block */}
      <div
        className="profile-form-container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.2)'
        }}
      >
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Compare & Align</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Job: {jdData.role} at {jdData.company} ✕ Candidate: {profileData.name}
          </p>
        </div>

        <button
          className="btn-submit"
          onClick={handleMatch}
          disabled={loadingStates.semanticMatch}
          style={{ padding: '14px 28px', fontSize: '14px' }}
        >
          {loadingStates.semanticMatch ? 'Analyzing Synonyms...' : 'Run Semantic Alignment Checker 🎯'}
        </button>
      </div>

      {/* Main Split Screen */}
      <div className="matching-split-grid">
        
        {/* Left Side: JD vs Profile Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* JD Box */}
          <div className="matching-card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
              💼 Target Job Requirements
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{jdData.role}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{jdData.company}</div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {jdData.skills.map((s, i) => (
                <span key={i} className={`skill-category cat-${s.category_code}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                  {s.skill_name}
                </span>
              ))}
            </div>
          </div>

          {/* Profile Box */}
          <div className="matching-card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
              👤 Candidate Profile State
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{profileData.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{profileData.education}</div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profileData.skills.map((s, i) => (
                <span key={i} className={`skill-category cat-${s.category_code}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                  {s.skill_name}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Semantic Matching Report Output */}
        <div className="matching-card" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {loadingStates.semanticMatch ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', gap: '16px' }}>
              <div className="spinner"></div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Comparing semantic vectors & mappings...</p>
            </div>
          ) : semanticMatchReport ? (
            <>
              <div className="matching-header">
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Semantic Job Fit Report</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>File Checked: {semanticMatchReport.jd_source_file}</span>
                </div>
                <div className="matching-score-circle">
                  {semanticMatchReport.match_score}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                
                {/* Matched Strengths */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ✓ Matched Strengths & Alignments
                  </h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {semanticMatchReport.matched_skills.map((item, idx) => (
                      <div key={idx} className="strength-item">
                        <span className="strength-icon">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                    {semanticMatchReport.matched_skills.length === 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No strong alignments found.</p>
                    )}
                  </div>
                </div>

                {/* Missing Requirements */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--error)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠ Missing Requirements & Skill Gaps
                  </h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {semanticMatchReport.missing_skills.map((item, idx) => (
                      <div key={idx} className="gap-item">
                        <span className="gap-icon">✕</span>
                        <span>{item}</span>
                      </div>
                    ))}
                    {semanticMatchReport.missing_skills.length === 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No critical missing requirements detected!</p>
                    )}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
              <h4 style={{ color: 'var(--text-secondary)' }}>Pending Fit Assessment</h4>
              <p style={{ fontSize: '12px', marginTop: '6px', maxWidth: '300px' }}>
                Click the 'Run Semantic Alignment Checker' button above to evaluate candidate compatibility against job parameters.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
