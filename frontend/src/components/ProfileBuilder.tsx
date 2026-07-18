import React, { useState, useEffect } from 'react';
import { useRadixState } from '../state/StateEngine';
import type { UnifiedCandidateProfile, SkillItem } from '../state/StateEngine';

export const ProfileBuilder: React.FC = () => {
  const { profileData, updateProfile, saveProfileToSink, loadingStates, setCurrentView } = useRadixState();
  const [activeTab, setActiveTab] = useState<'basic' | 'experience' | 'skills'>('basic');
  const [localProfile, setLocalProfile] = useState<UnifiedCandidateProfile | null>(null);

  // Sync local form state with context profileData when it changes (bridge load)
  useEffect(() => {
    if (profileData) {
      setLocalProfile(JSON.parse(JSON.stringify(profileData))); // Deep clone to avoid immediate side-effects
    }
  }, [profileData]);

  if (!localProfile) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
        <h2>No Candidate Profile Active</h2>
        <p style={{ marginTop: '8px', marginBottom: '24px', maxWidth: '400px' }}>
          Parse a resume on the dashboard or trigger a hackathon preset to auto-initialize the Profile State.
        </p>
        <button className="btn-submit" onClick={() => setCurrentView('dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Handle standard input changes
  const handleInputChange = (field: keyof UnifiedCandidateProfile, value: any) => {
    setLocalProfile((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  // Array item manipulators
  const handleArrayChange = (field: 'hackathons' | 'internships' | 'certifications' | 'preferred_roles', index: number, value: string) => {
    setLocalProfile((prev) => {
      if (!prev) return null;
      const updatedArray = [...prev[field]];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  const addArrayItem = (field: 'hackathons' | 'internships' | 'certifications' | 'preferred_roles') => {
    setLocalProfile((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: [...prev[field], ''] };
    });
  };

  const removeArrayItem = (field: 'hackathons' | 'internships' | 'certifications' | 'preferred_roles', index: number) => {
    setLocalProfile((prev) => {
      if (!prev) return null;
      const updatedArray = [...prev[field]];
      updatedArray.splice(index, 1);
      return { ...prev, [field]: updatedArray };
    });
  };

  // Skill manipulators
  const handleSkillChange = (index: number, field: keyof SkillItem, value: any) => {
    setLocalProfile((prev) => {
      if (!prev) return null;
      const updatedSkills = [...prev.skills];
      updatedSkills[index] = { ...updatedSkills[index], [field]: value };
      return { ...prev, skills: updatedSkills };
    });
  };

  const addSkillItem = () => {
    const newSkill: SkillItem = {
      skill_name: '',
      category_code: 'COD',
      evidence: 'Manually appended by candidate in Profile Builder.',
      confidence: 'high'
    };
    setLocalProfile((prev) => {
      if (!prev) return null;
      return { ...prev, skills: [...prev.skills, newSkill] };
    });
  };

  const removeSkillItem = (index: number) => {
    setLocalProfile((prev) => {
      if (!prev) return null;
      const updatedSkills = [...prev.skills];
      updatedSkills.splice(index, 1);
      return { ...prev, skills: updatedSkills };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localProfile) return;
    
    // Save to global state bridge
    updateProfile(localProfile);
    
    // Trigger API push (Supabase sync simulation)
    await saveProfileToSink();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header">
        <h1 className="view-title">Profile Builder Controller</h1>
        <p className="view-description">
          Declarative form controller linked to the global Candidate Profile State. Mutates and synchronizes data.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="profile-form-container">
        
        {/* Navigation Tabs */}
        <div className="profile-form-tabs">
          <button
            type="button"
            className={`profile-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            👤 Personal & Education
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            💼 Experience & Milestones
          </button>
          <button
            type="button"
            className={`profile-tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            🎯 Skill Competencies
          </button>
        </div>

        {/* TAB 1: BASIC INFORMATION */}
        {activeTab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="p-name">Full Name</label>
                <input
                  id="p-name"
                  type="text"
                  value={localProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="p-email">Email Address</label>
                <input
                  id="p-email"
                  type="email"
                  value={localProfile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="p-edu">Education & Credentials</label>
              <input
                id="p-edu"
                type="text"
                value={localProfile.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Preferred Target Roles</label>
              <div className="array-inputs-container">
                {localProfile.preferred_roles.map((role, idx) => (
                  <div key={idx} className="array-item-row">
                    <input
                      type="text"
                      placeholder="e.g. Staff Software Engineer"
                      value={role}
                      onChange={(e) => handleArrayChange('preferred_roles', idx, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeArrayItem('preferred_roles', idx)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add"
                  onClick={() => addArrayItem('preferred_roles')}
                >
                  + Add Role Target
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPERIENCE & HACKATHONS */}
        {activeTab === 'experience' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Internships & Professional History</label>
              <div className="array-inputs-container">
                {localProfile.internships.map((intern, idx) => (
                  <div key={idx} className="array-item-row">
                    <input
                      type="text"
                      placeholder="e.g. Intern at ByteCorp (2025)"
                      value={intern}
                      onChange={(e) => handleArrayChange('internships', idx, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeArrayItem('internships', idx)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add"
                  onClick={() => addArrayItem('internships')}
                >
                  + Add Position History
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Hackathons & Engineering Projects</label>
              <div className="array-inputs-container">
                {localProfile.hackathons.map((hack, idx) => (
                  <div key={idx} className="array-item-row">
                    <input
                      type="text"
                      placeholder="e.g. Antigravity Global Hackathon 2026 Winner"
                      value={hack}
                      onChange={(e) => handleArrayChange('hackathons', idx, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeArrayItem('hackathons', idx)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add"
                  onClick={() => addArrayItem('hackathons')}
                >
                  + Add Project/Hackathon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SKILLS & CERTIFICATIONS */}
        {activeTab === 'skills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="form-group">
              <label>Certifications</label>
              <div className="array-inputs-container">
                {localProfile.certifications.map((cert, idx) => (
                  <div key={idx} className="array-item-row">
                    <input
                      type="text"
                      placeholder="e.g. AWS Solutions Architect Professional"
                      value={cert}
                      onChange={(e) => handleArrayChange('certifications', idx, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeArrayItem('certifications', idx)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add"
                  onClick={() => addArrayItem('certifications')}
                >
                  + Add Certification
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Active Skill Competency Matrix ({localProfile.skills.length})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {localProfile.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr auto',
                      gap: '12px',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--border-color)',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Skill name (e.g. React)"
                      value={skill.skill_name}
                      onChange={(e) => handleSkillChange(idx, 'skill_name', e.target.value)}
                      required
                      style={{ padding: '8px' }}
                    />
                    <select
                      value={skill.category_code}
                      onChange={(e) => handleSkillChange(idx, 'category_code', e.target.value as any)}
                      style={{
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {['COD', 'DSA', 'OOD', 'APTI', 'COMM', 'AI', 'CLOUD', 'SQL', 'SWE', 'SYSD', 'NETW', 'OS', 'OTHER'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <select
                      value={skill.confidence}
                      onChange={(e) => handleSkillChange(idx, 'confidence', e.target.value as any)}
                      style={{
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <option value="high">High Confidence</option>
                      <option value="medium">Medium Confidence</option>
                      <option value="low">Low Confidence</option>
                    </select>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeSkillItem(idx)}
                      style={{ height: '36px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-add"
                  onClick={addSkillItem}
                  style={{ padding: '10px' }}
                >
                  + Add Custom Skill Node
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Sync Footer Actions */}
        <div className="form-actions">
          <div className="sync-status">
            {loadingStates.sync ? (
              <>
                <div className="sync-spinner"></div>
                <span>Synchronizing profile with Supabase sink...</span>
              </>
            ) : (
              <span>✓ State synchronized locally. Click save to sink.</span>
            )}
          </div>
          
          <button type="submit" className="btn-submit" disabled={loadingStates.sync}>
            💾 Save & Sync Profile State
          </button>
        </div>

      </form>
    </div>
  );
};
