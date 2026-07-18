import React, { useState, useRef } from 'react';
import { useRadixState } from '../state/StateEngine';

export const Dashboard: React.FC = () => {
  const {
    jdData,
    resumeData,
    loadingStates,
    parseJd,
    parseResume,
    loadHackathonDemo
  } = useRadixState();

  const [jdDragging, setJdDragging] = useState(false);
  const [resumeDragging, setResumeDragging] = useState(false);

  const [showJdText, setShowJdText] = useState(false);
  const [showResumeText, setShowResumeText] = useState(false);

  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');

  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers for JD
  const handleJdDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setJdDragging(true);
  };

  const handleJdDragLeave = () => {
    setJdDragging(false);
  };

  const handleJdDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setJdDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await parseJd(files[0]);
    }
  };

  // Drag and drop handlers for Resume
  const handleResumeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setResumeDragging(true);
  };

  const handleResumeDragLeave = () => {
    setResumeDragging(false);
  };

  const handleResumeDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setResumeDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await parseResume(files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="view-header">
        <h1 className="view-title">RADIX Talent Match</h1>
        <p className="view-description">
          Seamlessly analyze job descriptions, extract candidate skillsets, and evaluate benchmarking readiness in real-time.
        </p>
      </div>

      {/* Preset injector for hackathon demonstration */}
      <div className="demo-preset-panel">
        <div className="demo-preset-title">
          <span>🚀</span> HACKATHON LIVE DEMO MODE
        </div>
        <p className="demo-preset-desc">
          Click the presets below to instantly pre-populate the state engine with rich sample datasets. Perfect for rapid live-testing of comparative benchmarking and semantic match algorithms.
        </p>
        <div className="demo-preset-buttons">
          <button className="btn-demo" onClick={() => loadHackathonDemo('both')}>
            ⚡ Populate Both (JD + Resume)
          </button>
          <button className="btn-demo" onClick={() => loadHackathonDemo('jd')}>
            📝 Populate JD Only
          </button>
          <button className="btn-demo" onClick={() => loadHackathonDemo('resume')}>
            👤 Populate Resume Only
          </button>
        </div>
      </div>

      {/* The Core Uncluttered Dual Dropzones */}
      <div className="dashboard-grid">
        
        {/* JD ANALYTICS DROPZONE */}
        <div
          className={`dropzone-card ${jdDragging ? 'dragging' : ''}`}
          onDragOver={handleJdDragOver}
          onDragLeave={handleJdDragLeave}
          onDrop={handleJdDrop}
          onClick={() => !loadingStates.jd && jdFileInputRef.current?.click()}
        >
          {loadingStates.jd && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p style={{ fontWeight: 600, fontSize: '14px' }}>Analyzing Job Description...</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Extracting & Classifying Skills</p>
            </div>
          )}

          <input
            type="file"
            ref={jdFileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                await parseJd(e.target.files[0]);
              }
            }}
          />

          <div className="dropzone-icon">📝</div>
          <h3 className="dropzone-title">Job Description (JD) Analytics</h3>
          <p className="dropzone-subtitle">Drag and drop JD PDF/DOCX or click to browse</p>

          {jdData ? (
            <div className="file-status-badge loaded">
              ✓ Loaded: {jdData.source_file} ({jdData.skills.length} Skills)
            </div>
          ) : (
            <div className="file-status-badge">Waiting for file...</div>
          )}

          <div style={{ marginTop: '20px' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="fallback-toggle"
              onClick={() => setShowJdText(!showJdText)}
            >
              {showJdText ? 'Hide Text Fallback' : 'Or Paste Raw Text'}
            </button>
            
            {showJdText && (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <textarea
                  className="fallback-textarea"
                  placeholder="Paste job description text here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
                <button
                  className="fallback-submit"
                  disabled={!jdText.trim()}
                  onClick={async () => {
                    await parseJd(null, jdText);
                  }}
                >
                  Analyze Text
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RESUME PARSER DROPZONE */}
        <div
          className={`dropzone-card ${resumeDragging ? 'dragging' : ''}`}
          onDragOver={handleResumeDragOver}
          onDragLeave={handleResumeDragLeave}
          onDrop={handleResumeDrop}
          onClick={() => !loadingStates.resume && resumeFileInputRef.current?.click()}
        >
          {loadingStates.resume && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p style={{ fontWeight: 600, fontSize: '14px' }}>Parsing Candidate CV...</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Extracting Entities & Skillsets</p>
            </div>
          )}

          <input
            type="file"
            ref={resumeFileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                await parseResume(e.target.files[0]);
              }
            }}
          />

          <div className="dropzone-icon">👤</div>
          <h3 className="dropzone-title">Resume Parsing Engine</h3>
          <p className="dropzone-subtitle">Drag and drop Resume PDF/DOCX or click to browse</p>

          {resumeData ? (
            <div className="file-status-badge loaded">
              ✓ Loaded: {resumeData.source_file} ({resumeData.skills.length} Skills)
            </div>
          ) : (
            <div className="file-status-badge">Waiting for file...</div>
          )}

          <div style={{ marginTop: '20px' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="fallback-toggle"
              onClick={() => setShowResumeText(!showResumeText)}
            >
              {showResumeText ? 'Hide Text Fallback' : 'Or Paste Raw Text'}
            </button>
            
            {showResumeText && (
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <textarea
                  className="fallback-textarea"
                  placeholder="Paste candidate resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                <button
                  className="fallback-submit"
                  disabled={!resumeText.trim()}
                  onClick={async () => {
                    await parseResume(null, resumeText);
                  }}
                >
                  Parse Text
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
