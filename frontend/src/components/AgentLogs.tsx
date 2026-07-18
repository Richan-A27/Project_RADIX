import React, { useState } from 'react';
import { useRadixState } from '../state/StateEngine';

export const AgentLogs: React.FC = () => {
  const { agentLogs } = useRadixState();
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div className="logs-accordion">
      <div 
        className={`logs-header ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="logs-header-title">
          <span>🤖</span> Antigravity Agent Orchestrator: Pipeline Reasoning Logs
          <span className="logo-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: 'none' }}>
            {agentLogs.length} Events
          </span>
        </div>
        <div className={`logs-chevron ${expanded ? 'expanded' : ''}`}>
          ▼
        </div>
      </div>
      
      {expanded && (
        <div className="logs-body">
          {agentLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
              Pipeline idle. Logs will populate dynamically as LLM extraction agents execute...
            </div>
          ) : (
            agentLogs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-timestamp">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className={`log-level ${log.level}`}>
                  {log.level}
                </span>
                <span className="log-message">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
