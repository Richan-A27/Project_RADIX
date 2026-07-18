import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8001/api';

const COMPETENCY_TIERS_MAP = {
  "0-NONE": 0, "2-CU": 1, "3-CU": 2, "4-CU": 3, "4-AP": 4,
  "5-AP": 5, "6-AP": 6, "5-AS": 7, "6-AS": 8, "7-AS": 9,
  "8-AS": 10, "9-EV": 11
};

function App() {
  const [mode, setMode] = useState('match'); // 'match' or 'talent'
  
  const [candidates, setCandidates] = useState([]);
  const [jds, setJds] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedJdId, setSelectedJdId] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [talentChecking, setTalentChecking] = useState(false);
  const [error, setError] = useState(null);
  
  const [matchResult, setMatchResult] = useState(null);
  const [talentResult, setTalentResult] = useState(null);
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' or 'categories'

  // Load candidates, JDs and benchmark companies
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [candRes, jdRes, compRes] = await Promise.all([
          axios.get(`${API_BASE}/candidates`),
          axios.get(`${API_BASE}/jds`),
          axios.get(`${API_BASE}/companies`)
        ]);
        
        setCandidates(candRes.data);
        setJds(jdRes.data);
        setCompanies(compRes.data);
        
        if (candRes.data.length > 0) {
          setSelectedCandidateId(candRes.data[0].id.toString());
        }
        if (jdRes.data.length > 0) {
          setSelectedJdId(jdRes.data[0].id.toString());
        }
        if (compRes.data.length > 0) {
          setSelectedCompany(compRes.data[0]);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Could not connect to backend server. Make sure the FastAPI backend is running on port 8000.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Perform Skill Match
  const handleMatch = async (candidateId, jdId) => {
    const cId = candidateId !== undefined ? candidateId : selectedCandidateId;
    const jId = jdId !== undefined ? jdId : selectedJdId;
    if (cId === '' || jId === '') return;
    
    setMatching(true);
    setError(null);
    try {
      const matchRes = await axios.post(`${API_BASE}/match`, {
        candidate_id: parseInt(cId, 10),
        jd_id: parseInt(jId, 10)
      });
      setMatchResult(matchRes.data);
    } catch (err) {
      console.error("Match API error:", err);
      setError("Failed to calculate matching score. Check backend server logs.");
    } finally {
      setMatching(false);
    }
  };

  // Perform Talent Check
  const handleTalentCheck = async (candidateId, companyName) => {
    const cId = candidateId !== undefined ? candidateId : selectedCandidateId;
    const comp = companyName !== undefined ? companyName : selectedCompany;
    if (cId === '' || comp === '') return;
    
    setTalentChecking(true);
    setError(null);
    try {
      const talentRes = await axios.post(`${API_BASE}/talent-check`, {
        candidate_id: parseInt(cId, 10),
        company_name: comp
      });
      setTalentResult(talentRes.data);
    } catch (err) {
      console.error("Talent Check API error:", err);
      setError("Failed to run Talent Check. Check backend server logs.");
    } finally {
      setTalentChecking(false);
    }
  };

  // Auto trigger when parameters change
  useEffect(() => {
    if (mode === 'match' && selectedCandidateId !== '' && selectedJdId !== '') {
      handleMatch(selectedCandidateId, selectedJdId);
    } else if (mode === 'talent' && selectedCandidateId !== '' && selectedCompany !== '') {
      handleTalentCheck(selectedCandidateId, selectedCompany);
    }
  }, [mode, selectedCandidateId, selectedJdId, selectedCompany]);

  // Styling helper classes
  const getScoreClass = (score) => {
    if (score >= 80) return 'match-high';
    if (score >= 50) return 'match-medium';
    return 'match-low';
  };

  // Human readable category names helper
  const formatCategoryName = (code) => {
    return code
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Get percentage width of competency tier
  const getTierPercent = (tier) => {
    const val = COMPETENCY_TIERS_MAP[tier] || 0;
    return (val / 11) * 100;
  };

  // Math for circular progress SVG
  const getCircularOffset = (score) => {
    return 502 - (502 * score) / 100;
  };

  const getCandidateName = () => {
    const cand = candidates.find(c => c.id.toString() === selectedCandidateId);
    return cand ? cand.name : "Candidate";
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-title-badge">RADIX Integrated Portal</div>
        <h1 className="app-title">RADIX Talent Match</h1>
        <p className="app-subtitle">
          An integrated platform for candidates. Perform precise skill matching against specific job descriptions or cross-reference competency tiers with global company benchmarks.
        </p>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderColor: 'var(--color-danger)', background: 'rgba(244, 63, 94, 0.05)' }}>
          <p style={{ color: 'var(--color-danger)', fontWeight: '600' }}>⚠️ Connection Error</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{error}</p>
          <button className="btn-primary" style={{ marginTop: '1rem', padding: '0.5rem 1.25rem' }} onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="mode-toggle-container">
        <button 
          className={`mode-btn ${mode === 'match' ? 'active' : ''}`}
          onClick={() => setMode('match')}
        >
          🔍 Skill Matching
        </button>
        <button 
          className={`mode-btn ${mode === 'talent' ? 'active' : ''}`}
          onClick={() => setMode('talent')}
        >
          📊 Talent Check
        </button>
      </div>

      {/* Control panel based on Mode */}
      <div className="glass-panel controls-grid">
        <div className="input-group">
          <label className="input-label" htmlFor="candidate-select">Select Candidate Profile</label>
          <select 
            id="candidate-select" 
            className="custom-select"
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
            disabled={loading}
          >
            {candidates.map((cand) => (
              <option key={cand.id} value={cand.id}>
                {cand.name} ({cand.preferred_roles.join(', ') || 'Generalist'})
              </option>
            ))}
          </select>
        </div>

        {mode === 'match' ? (
          <>
            <div className="input-group">
              <label className="input-label" htmlFor="jd-select">Select Target Role / JD</label>
              <select 
                id="jd-select" 
                className="custom-select"
                value={selectedJdId}
                onChange={(e) => setSelectedJdId(e.target.value)}
                disabled={loading}
              >
                {jds.map((jd) => (
                  <option key={jd.id} value={jd.id}>
                    {jd.company} - {jd.role}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="btn-primary" 
              onClick={() => handleMatch()} 
              disabled={matching || loading || selectedCandidateId === '' || selectedJdId === ''}
            >
              {matching ? 'Matching...' : 'Skill Match'}
            </button>
          </>
        ) : (
          <>
            <div className="input-group">
              <label className="input-label" htmlFor="company-select">Select Benchmark Company</label>
              <select 
                id="company-select" 
                className="custom-select"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                disabled={loading}
              >
                {companies.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="btn-primary" 
              onClick={() => handleTalentCheck()} 
              disabled={talentChecking || loading || selectedCandidateId === '' || selectedCompany === ''}
            >
              {talentChecking ? 'Evaluating...' : 'Talent Check'}
            </button>
          </>
        )}
      </div>

      {/* Loading States */}
      {matching && !matchResult && (
        <div className="glass-panel empty-state">
          <div className="spinner"></div>
          <h3>Running Talent Match Analysis</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comparing competency profiles and calculating gaps...</p>
        </div>
      )}

      {talentChecking && !talentResult && (
        <div className="glass-panel empty-state">
          <div className="spinner"></div>
          <h3>Running Company Benchmarking</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cross-referencing candidate levels against competency tiers...</p>
        </div>
      )}

      {/* Main Results Dashboard (Skill Matching Mode) */}
      {mode === 'match' && matchResult && (
        <div className="dashboard-grid">
          {/* Left panel: ScoreCard */}
          <div className="glass-panel score-card">
            <h3 className="input-label" style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.75rem' }}>
              Match Summary
            </h3>
            
            <div className="radial-progress-container">
              <svg className="radial-progress-svg" viewBox="0 0 180 180">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-primary)" />
                    <stop offset="100%" stopColor="var(--accent-secondary)" />
                  </linearGradient>
                </defs>
                <circle className="radial-progress-bg" cx="90" cy="90" r="80" />
                <circle 
                  className="radial-progress-bar" 
                  cx="90" 
                  cy="90" 
                  r="80" 
                  strokeDasharray="502" 
                  strokeDashoffset={getCircularOffset(matchResult.match_score)}
                />
              </svg>
              <div className="radial-progress-text">
                <span className="radial-percentage">{matchResult.match_score}%</span>
                <span className="radial-label">Fit Score</span>
              </div>
            </div>
            
            <span className={`score-badge ${getScoreClass(matchResult.match_score)}`}>
              {matchResult.match_score >= 80 ? 'Strong Match' : matchResult.match_score >= 50 ? 'Moderate Match' : 'Gap Identified'}
            </span>
            
            <p className="score-summary-text">
              {matchResult.match_score >= 80 
                ? `${matchResult.candidate_name} is an excellent fit for the ${matchResult.role} position at ${matchResult.company}, meeting almost all technological and competency requirements.`
                : matchResult.match_score >= 50 
                ? `${matchResult.candidate_name} is a moderate fit for the ${matchResult.role} position at ${matchResult.company}. They meet key core skills but have some gaps that need address.`
                : `${matchResult.candidate_name} requires significant upskilling or experience to meet the minimum bar for the ${matchResult.role} position at ${matchResult.company}.`
              }
            </p>

            {/* Category Bars */}
            <div className="category-bars-container">
              <h4 className="input-label" style={{ fontSize: '0.75rem', textAlign: 'left', marginBottom: '0.25rem' }}>
                Competency Categories
              </h4>
              {Object.entries(matchResult.category_scores).map(([cat, info]) => (
                <div key={cat} className="category-bar-item">
                  <div className="category-bar-header">
                    <span className="category-name">{cat}</span>
                    <span className="category-ratio">{info.matched}/{info.required} matched</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${info.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Details */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div className="details-tabs">
              <button 
                className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveTab('skills')}
              >
                Skill Breakdown
              </button>
              <button 
                className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                Competency Grid
              </button>
            </div>

            {activeTab === 'skills' ? (
              <div className="skills-grid">
                <div>
                  <h3 className="skills-column-title matched">
                    <span>✓</span> Matched Skills ({matchResult.matched_skills.length})
                  </h3>
                  {matchResult.matched_skills.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills match this role's requirements.</p>
                  ) : (
                    <div className="skills-list">
                      {matchResult.matched_skills.map((skill, idx) => (
                        <div key={idx} className="skill-card">
                          <div className="skill-card-header">
                            <span className="skill-name-badge">{skill.skill_name}</span>
                            <span className="skill-category-badge">{skill.category_code}</span>
                          </div>
                          <p className="skill-evidence">
                            <strong>Candidate Evidence:</strong> "{skill.candidate_evidence}"
                          </p>
                          <p className="skill-evidence" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '0.4rem', paddingTop: '0.4rem', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <strong>JD Context:</strong> {skill.jd_evidence}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`skill-confidence ${skill.candidate_confidence}`}>
                              Confidence: {skill.candidate_confidence}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)' }}>
                              Sim: {skill.similarity}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="skills-column-title missing">
                    <span>✗</span> Missing Skills ({matchResult.missing_skills.length})
                  </h3>
                  {matchResult.missing_skills.length === 0 ? (
                    <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', fontWeight: '600' }}>✓ Full capability match! No missing skills.</p>
                  ) : (
                    <div className="skills-list">
                      {matchResult.missing_skills.map((skill, idx) => (
                        <div key={idx} className="skill-card" style={{ borderLeft: '3px solid var(--color-danger)' }}>
                          <div className="skill-card-header">
                            <span className="skill-name-badge">{skill.skill_name}</span>
                            <span className="skill-category-badge">{skill.category_code}</span>
                          </div>
                          <p className="skill-evidence">
                            <strong>Requirement Context:</strong> {skill.evidence}
                          </p>
                          <div style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(244, 63, 94, 0.08)', color: 'var(--color-danger)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
                              GAP DETECTED
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="comparison-table-container">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Competency Code</th>
                      <th>Required Count</th>
                      <th>Matched Count</th>
                      <th>Match Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(matchResult.category_scores).map(([cat, info]) => {
                      const isComplete = info.score === 100;
                      const isZero = info.score === 0;
                      return (
                        <tr key={cat}>
                          <td><span className="category-pill">{cat}</span></td>
                          <td>{info.required}</td>
                          <td>{info.matched}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span>{info.score}%</span>
                              <div className="progress-track" style={{ width: '80px', flexShrink: 0 }}>
                                <div className="progress-fill" style={{ width: `${info.score}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isComplete ? (
                              <span className="status-badge complete">● Full Coverage</span>
                            ) : isZero ? (
                              <span className="status-badge missing">● Gap</span>
                            ) : (
                              <span className="status-badge partial">● Partial ({Math.round(info.score)}%)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Results Dashboard (Talent Check Mode) */}
      {mode === 'talent' && talentResult && (
        <div className="dashboard-grid">
          
          {/* Left Panel: Circular readiness score */}
          <div className="glass-panel score-card">
            <h3 className="input-label" style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.75rem' }}>
              Readiness Check
            </h3>
            
            <div className="radial-progress-container">
              <svg className="radial-progress-svg" viewBox="0 0 180 180">
                <circle className="radial-progress-bg" cx="90" cy="90" r="80" />
                <circle 
                  className="radial-progress-bar" 
                  cx="90" 
                  cy="90" 
                  r="80" 
                  strokeDasharray="502" 
                  strokeDashoffset={getCircularOffset(talentResult.readiness_score)}
                />
              </svg>
              <div className="radial-progress-text">
                <span className="radial-percentage">{talentResult.readiness_score}%</span>
                <span className="radial-label">Readiness</span>
              </div>
            </div>
            
            <span className={`score-badge ${getScoreClass(talentResult.readiness_score)}`}>
              {talentResult.readiness_score >= 80 ? 'Prepped & Ready' : talentResult.readiness_score >= 50 ? 'Developing' : 'Major Gaps'}
            </span>
            
            <p className="score-summary-text">
              {talentResult.readiness_score >= 80 
                ? `${getCandidateName()} is highly qualified for the benchmark bar expected at ${talentResult.company}.`
                : talentResult.readiness_score >= 50
                ? `${getCandidateName()} meets the majority of baseline competency tiers for ${talentResult.company}, but target gaps should be mitigated.`
                : `${getCandidateName()} has significant competency gap deficits relative to ${talentResult.company}'s employment benchmark bar.`
              }
            </p>
          </div>

          {/* Right Panel: Detailed Competency Grid Comparison */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 className="skills-column-title" style={{ color: 'white', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              Benchmarked Competencies ({talentResult.skillset_gap.length})
            </h3>
            
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Competency Domain</th>
                    <th>Benchmark Target</th>
                    <th>Candidate Rating</th>
                    <th>Visual Gap Analysis</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {talentResult.skillset_gap.map((gapItem, idx) => {
                    const reqVal = COMPETENCY_TIERS_MAP[gapItem.required_level] || 0;
                    const candVal = COMPETENCY_TIERS_MAP[gapItem.candidate_level] || 0;
                    
                    return (
                      <tr key={idx}>
                        <td>
                          <span className="category-pill" style={{ textTransform: 'none' }}>
                            {formatCategoryName(gapItem.category_code)}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{gapItem.required_level}</td>
                        <td style={{ fontWeight: '600', color: gapItem.gap ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {gapItem.candidate_level}
                        </td>
                        <td>
                          {/* Visual Double Track Progress bar */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              <span>Cand</span>
                              <span>Target</span>
                            </div>
                            <div className="progress-track" style={{ position: 'relative', height: '10px' }}>
                              {/* Target Marker */}
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  left: `${getTierPercent(gapItem.required_level)}%`, 
                                  top: 0, 
                                  bottom: 0, 
                                  width: '3px', 
                                  backgroundColor: 'var(--text-primary)', 
                                  zIndex: 2,
                                  boxShadow: '0 0 4px white'
                                }} 
                                title={`Target: ${gapItem.required_level}`}
                              />
                              {/* Candidate Fill */}
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${getTierPercent(gapItem.candidate_level)}%`,
                                  background: gapItem.gap 
                                    ? 'linear-gradient(90deg, #f43f5e 0%, #fda4af 100%)' 
                                    : 'linear-gradient(90deg, #10b981 0%, #6ee7b7 100%)',
                                  height: '100%'
                                }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          {gapItem.gap ? (
                            <span className="status-badge missing" style={{ background: 'var(--color-danger-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              ✘ Gap Detected
                            </span>
                          ) : (
                            <span className="status-badge complete" style={{ background: 'var(--color-success-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              ✔ Benchmark Met
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
