import React, { useState } from 'react';
import { useRadixState } from '../state/StateEngine';

export const TalentCheck: React.FC = () => {
  const {
    profileData,
    talentCheckReport,
    executeTalentCheck,
    loadingStates,
    setCurrentView
  } = useRadixState();

  const [selectedCompany, setSelectedCompany] = useState<string>('Google');

  const companies = [
    { name: 'Google', desc: 'Focuses heavily on DSA, Coding complexity, and large-scale System Design.', icon: '🌐' },
    { name: 'Microsoft', desc: 'Prioritizes Software Engineering best practices, Cloud solutions, and OOD.', icon: '❖' },
    { name: 'Oracle Financial Services Software', desc: 'Emphasizes SQL databases, Operating Systems, Networking, and Transactional SWE.', icon: '🖳' }
  ];

  if (!profileData) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h2>No Candidate Profile Loaded</h2>
        <p style={{ marginTop: '8px', marginBottom: '24px', maxWidth: '400px' }}>
          Upload a resume on the dashboard first to build the profile state before executing talent benchmarking.
        </p>
        <button className="btn-submit" onClick={() => setCurrentView('dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleExecute = async () => {
    await executeTalentCheck(selectedCompany);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header">
        <h1 className="view-title">Talent Check Benchmarking</h1>
        <p className="view-description">
          Evaluate candidate profile competencies against standard enterprise benchmarks across the 12 RADIX classes.
        </p>
      </div>

      <div className="company-selector-container">
        
        {/* Left Side: Selectors */}
        <div className="company-card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Benchmark Matrix</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {companies.map((comp) => (
              <button
                key={comp.name}
                className={`company-option ${selectedCompany === comp.name ? 'selected' : ''}`}
                onClick={() => setSelectedCompany(comp.name)}
                type="button"
              >
                <div className="company-name">{comp.icon} {comp.name}</div>
                <div className="company-description">{comp.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleExecute}
            className="btn-execute"
            disabled={loadingStates.talentCheck}
          >
            {loadingStates.talentCheck ? 'Evaluating Matrix...' : 'Execute Talent Check 🚀'}
          </button>
        </div>

        {/* Right Side: Visual Comparator Reports */}
        <div className="talent-results-card">
          {loadingStates.talentCheck ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
              <div className="spinner"></div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Computing skill deviations against {selectedCompany} threshold...</p>
            </div>
          ) : talentCheckReport ? (
            <>
              {/* Score header */}
              <div className="score-banner">
                <div className="readiness-score-container">
                  <div
                    className="readiness-radial"
                    style={{ '--score': talentCheckReport.readiness_score } as React.CSSProperties}
                  >
                    <span className="readiness-radial-text">{talentCheckReport.readiness_score}%</span>
                  </div>
                  <div>
                    <div className="readiness-label">{selectedCompany} Readiness Level</div>
                    <div className="readiness-sublabel">Candidate: {profileData.name}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Matrix</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-hover)' }}>{talentCheckReport.company} Benchmark</div>
                </div>
              </div>

              {/* Benchmark Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Category Code</th>
                      <th>Benchmarked Target</th>
                      <th>Candidate Skill Score</th>
                      <th style={{ width: '40%' }}>Competency Variance</th>
                      <th>Gap?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {talentCheckReport.skillset_gap.map((gapItem, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 600 }}>
                          <span className={`skill-category cat-${gapItem.category_code}`} style={{ fontSize: '10px' }}>
                            {gapItem.category_code}
                          </span>
                        </td>
                        <td>{gapItem.required_level} / 10</td>
                        <td>{gapItem.candidate_level} / 10</td>
                        <td>
                          <div
                            className="level-bar-container"
                            style={{
                              '--req-level': gapItem.required_level,
                              '--cand-level': gapItem.candidate_level
                            } as React.CSSProperties}
                          >
                            <div className="level-bar-required"></div>
                            <div className="level-bar-candidate"></div>
                          </div>
                        </td>
                        <td>
                          <span className={`gap-indicator ${gapItem.gap ? 'yes' : 'no'}`}>
                            {gapItem.gap ? 'GAP DETECTED' : 'EVALUATED OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <h4 style={{ color: 'var(--text-secondary)' }}>Ready to Benchmarking</h4>
              <p style={{ fontSize: '12px', marginTop: '6px', maxWidth: '300px' }}>Select a target company on the left and click Execute to run the comparative gap engine.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
