import React from 'react';
import { StateEngineProvider, useRadixState } from './state/StateEngine';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { JDAnalytics } from './components/JDAnalytics';
import { ResumeParser } from './components/ResumeParser';
import { ProfileBuilder } from './components/ProfileBuilder';
import { TalentCheck } from './components/TalentCheck';
import { SkillMatching } from './components/SkillMatching';
import { AgentLogs } from './components/AgentLogs';

const MainLayout: React.FC = () => {
  const { currentView } = useRadixState();

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'jd-analytics':
        return <JDAnalytics />;
      case 'resume-parser':
        return <ResumeParser />;
      case 'profile-builder':
        return <ProfileBuilder />;
      case 'talent-check':
        return <TalentCheck />;
      case 'skill-matching':
        return <SkillMatching />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {renderActiveView()}
        <AgentLogs />
      </main>
    </div>
  );
};

function App() {
  return (
    <StateEngineProvider>
      <MainLayout />
    </StateEngineProvider>
  );
}

export default App;
