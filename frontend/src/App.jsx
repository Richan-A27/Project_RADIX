import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TalentMatch from './pages/TalentMatch';
import ProfileBuilder from './pages/ProfileBuilder';
import JDAnalytics from './pages/JDAnalytics';
import ResumeParser from './pages/ResumeParser';

function App() {
  const [activePage, setActivePage] = useState('talent');

  const renderPage = () => {
    switch(activePage) {
      case 'talent': return <TalentMatch />;
      case 'profile': return <ProfileBuilder />;
      case 'jd': return <JDAnalytics />;
      case 'resume': return <ResumeParser />;
      default: return <TalentMatch />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
