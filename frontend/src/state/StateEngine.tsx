import React, { createContext, useContext, useState, useEffect } from 'react';

// Data Schemas
export interface SkillItem {
  skill_name: string;
  category_code: 'COD' | 'DSA' | 'OOD' | 'APTI' | 'COMM' | 'AI' | 'CLOUD' | 'SQL' | 'SWE' | 'SYSD' | 'NETW' | 'OS' | 'OTHER';
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedArtifact {
  source_type: 'jd' | 'resume';
  source_file: string;
  company?: string;
  role?: string;
  skills: SkillItem[];
}

export interface UnifiedCandidateProfile {
  name: string;
  email: string;
  education: string;
  skills: SkillItem[];
  hackathons: string[];
  internships: string[];
  certifications: string[];
  preferred_roles: string[];
  cv_file: string;
}

export interface TalentGapItem {
  category_code: string;
  required_level: number;
  candidate_level: number;
  gap: boolean;
}

export interface TalentCheckReport {
  company: string;
  skillset_gap: TalentGapItem[];
  readiness_score: number;
}

export interface SemanticMatchReport {
  jd_source_file: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
}

export interface AgentLog {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
}

// Router views
export type ViewName = 'dashboard' | 'jd-analytics' | 'resume-parser' | 'profile-builder' | 'talent-check' | 'skill-matching';

interface StateContextType {
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  
  // States
  jdData: ExtractedArtifact | null;
  resumeData: ExtractedArtifact | null;
  profileData: UnifiedCandidateProfile | null;
  talentCheckReport: TalentCheckReport | null;
  semanticMatchReport: SemanticMatchReport | null;
  
  // Logs & Loading States
  agentLogs: AgentLog[];
  loadingStates: {
    jd: boolean;
    resume: boolean;
    sync: boolean;
    talentCheck: boolean;
    semanticMatch: boolean;
  };
  
  // Mutation functions
  parseJd: (file: File | null, rawText?: string) => Promise<void>;
  parseResume: (file: File | null, rawText?: string) => Promise<void>;
  updateProfile: (profile: UnifiedCandidateProfile) => void;
  saveProfileToSink: () => Promise<void>;
  executeTalentCheck: (company: string) => Promise<void>;
  executeSemanticMatch: () => Promise<void>;
  loadHackathonDemo: (type: 'jd' | 'resume' | 'both') => void;
  clearAll: () => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export const StateEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  
  const [jdData, setJdData] = useState<ExtractedArtifact | null>(null);
  const [resumeData, setResumeData] = useState<ExtractedArtifact | null>(null);
  const [profileData, setProfileData] = useState<UnifiedCandidateProfile | null>({
    name: 'Alex Mercer',
    email: 'alex.mercer@radix.io',
    education: 'B.S. in Computer Science - Tech University',
    skills: [
      { skill_name: 'Python Programming', category_code: 'COD', evidence: 'Extracted from default template.', confidence: 'high' },
      { skill_name: 'React.js', category_code: 'COD', evidence: 'Extracted from default template.', confidence: 'medium' },
      { skill_name: 'Data Structures & Algorithms', category_code: 'DSA', evidence: 'Extracted from default template.', confidence: 'high' },
      { skill_name: 'System Design Principles', category_code: 'SYSD', evidence: 'Extracted from default template.', confidence: 'medium' },
      { skill_name: 'AWS Cloud Services', category_code: 'CLOUD', evidence: 'Extracted from default template.', confidence: 'high' }
    ],
    hackathons: ['RADIX Hackathon 2026'],
    internships: ['Software Engineer Intern at Google'],
    certifications: ['AWS Certified Cloud Practitioner'],
    preferred_roles: ['Fullstack Developer'],
    cv_file: 'alex_cv_template.pdf'
  });
  const [talentCheckReport, setTalentCheckReport] = useState<TalentCheckReport | null>(null);
  const [semanticMatchReport, setSemanticMatchReport] = useState<SemanticMatchReport | null>(null);
  
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    jd: false,
    resume: false,
    sync: false,
    talentCheck: false,
    semanticMatch: false
  });

  // Save API key to localStorage when changed
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // Unified logger
  const addLogs = (newLogs: AgentLog[]) => {
    setAgentLogs(prev => [...prev, ...newLogs]);
  };

  const clearAll = () => {
    setJdData(null);
    setResumeData(null);
    setProfileData(null);
    setTalentCheckReport(null);
    setSemanticMatchReport(null);
    setAgentLogs([]);
  };

  // 1. JD Analytics parser caller
  const parseJd = async (file: File | null, rawText?: string) => {
    setLoadingStates(prev => ({ ...prev, jd: true }));
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (rawText) {
        formData.append('text', rawText);
      }

      const headers: HeadersInit = {};
      if (apiKey) {
        headers['x-gemini-key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/parse-jd`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const result = await response.json();
      setJdData(result.data);
      if (result.logs) addLogs(result.logs);
      
      // Auto routing helper for better flow
      setCurrentView('jd-analytics');
    } catch (error: any) {
      console.error(error);
      addLogs([{
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `JD Analytics processing failed: ${error.message}`
      }]);
    } finally {
      setLoadingStates(prev => ({ ...prev, jd: false }));
    }
  };

  // 2. Resume parser caller (with state bridge)
  const parseResume = async (file: File | null, rawText?: string) => {
    setLoadingStates(prev => ({ ...prev, resume: true }));
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else if (rawText) {
        formData.append('text', rawText);
      }

      const headers: HeadersInit = {};
      if (apiKey) {
        headers['x-gemini-key'] = apiKey;
      }

      const response = await fetch(`${API_BASE_URL}/parse-resume`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();
      setResumeData({
        source_type: 'resume',
        source_file: result.data.cv_file || 'resume.pdf',
        skills: result.data.skills
      });

      // STATE BRIDGE: Mutate Global Profile State immediately on parsing complete
      const mappedProfile: UnifiedCandidateProfile = {
        name: result.data.name,
        email: result.data.email,
        education: result.data.education,
        skills: result.data.skills,
        hackathons: result.data.hackathons || [],
        internships: result.data.internships || [],
        certifications: result.data.certifications || [],
        preferred_roles: result.data.preferred_roles || [],
        cv_file: result.data.cv_file || 'resume.pdf'
      };
      
      setProfileData(mappedProfile);
      if (result.logs) addLogs(result.logs);
      
      // Auto routing to Profile Builder tab
      setCurrentView('profile-builder');
    } catch (error: any) {
      console.error(error);
      addLogs([{
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `Resume parsing failed: ${error.message}`
      }]);
    } finally {
      setLoadingStates(prev => ({ ...prev, resume: false }));
    }
  };

  const updateProfile = (profile: UnifiedCandidateProfile) => {
    setProfileData(profile);
    addLogs([{
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Candidate profile locally updated by Profile Builder Form Controller.`
    }]);
  };

  // 3. Persist Profile to Supabase data sink simulator
  const saveProfileToSink = async () => {
    if (!profileData) return;
    setLoadingStates(prev => ({ ...prev, sync: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error(`Failed to push to data sink: ${response.statusText}`);
      }

      const result = await response.json();
      addLogs([{
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: `Supabase Sync Agent: ${result.message}`
      }]);
    } catch (error: any) {
      console.error(error);
      addLogs([{
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `Supabase data sync failed: ${error.message}`
      }]);
    } finally {
      setLoadingStates(prev => ({ ...prev, sync: false }));
    }
  };

  // 4. Comparative Engine: Evaluates profile levels against static local matrix
  const executeTalentCheck = async (company: string) => {
    if (!profileData) return;
    setLoadingStates(prev => ({ ...prev, talentCheck: true }));
    
    try {
      // Simulate API fetch delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Read local matrix (simulating fetch of talent_check_company_skillsets.json)
      const matrixResponse = await fetch('/talent_check_company_skillsets.json');
      let matrix: Record<string, Record<string, number>>;
      
      if (matrixResponse.ok) {
        matrix = await matrixResponse.json();
      } else {
        // Local matrix fallback
        matrix = {
          "Google": { DSA: 9, COD: 9, OOD: 8, APTI: 8, COMM: 7, AI: 8, CLOUD: 7, SQL: 6, SWE: 8, SYSD: 8, NETW: 6, OS: 7 },
          "Microsoft": { DSA: 8, COD: 8, OOD: 9, APTI: 7, COMM: 8, AI: 8, CLOUD: 9, SQL: 7, SWE: 9, SYSD: 8, NETW: 7, OS: 7 },
          "Oracle Financial Services": { DSA: 6, COD: 7, OOD: 7, APTI: 8, COMM: 8, AI: 5, CLOUD: 7, SQL: 9, SWE: 8, SYSD: 7, NETW: 7, OS: 8 },
          "Oracle Financial Services Software": { DSA: 6, COD: 7, OOD: 7, APTI: 8, COMM: 8, AI: 5, CLOUD: 7, SQL: 9, SWE: 8, SYSD: 7, NETW: 7, OS: 8 }
        };
      }

      const benchmarks = matrix[company];
      if (!benchmarks) throw new Error(`Target company benchmarks not found for: ${company}`);

      // Count occurrence frequencies in candidate's skills to simulate "levels" (1-10 scale)
      const skillset_gap: TalentGapItem[] = Object.entries(benchmarks).map(([category, reqLevel]) => {
        // Filter candidate skills under this category
        const candSkillsInCategory = profileData.skills.filter(s => s.category_code === category);
        
        // Compute candidates simulated level (1 to 10 intensity):
        // Base is 3 if they have at least one skill in that category.
        // Increments by 2 for each high-confidence skill, 1 for medium confidence.
        let candLevel = 0;
        if (candSkillsInCategory.length > 0) {
          candLevel = 3;
          candSkillsInCategory.forEach(s => {
            if (s.confidence === 'high') candLevel += 2;
            else if (s.confidence === 'medium') candLevel += 1;
          });
          candLevel = Math.min(10, candLevel);
        }

        return {
          category_code: category,
          required_level: reqLevel,
          candidate_level: candLevel,
          gap: candLevel < reqLevel
        };
      });

      // Compute readiness score (0-100) based on meet ratio
      const noGapsCount = skillset_gap.filter(g => !g.gap).length;
      const readiness_score = Math.round((noGapsCount / skillset_gap.length) * 100);

      const report: TalentCheckReport = {
        company,
        skillset_gap,
        readiness_score
      };

      setTalentCheckReport(report);
      addLogs([
        {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `Talent Check Engine: Evaluated Candidate [${profileData.name}] profile against ${company} benchmark.`
        },
        {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `Resulting Readiness Score: ${readiness_score}%. Detected gaps: ${skillset_gap.filter(g => g.gap).map(g => g.category_code).join(', ') || 'None'}`
        }
      ]);
    } catch (error: any) {
      console.error(error);
      addLogs([{
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `Talent Check Comparative Engine failed: ${error.message}`
      }]);
    } finally {
      setLoadingStates(prev => ({ ...prev, talentCheck: false }));
    }
  };

  // 5. Semantic Matcher Engine calling backend
  const executeSemanticMatch = async () => {
    if (!jdData || !profileData) return;
    setLoadingStates(prev => ({ ...prev, semanticMatch: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/semantic-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {})
        },
        body: JSON.stringify({
          jd: jdData,
          profile: profileData
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const result = await response.json();
      setSemanticMatchReport(result.data);
      if (result.logs) addLogs(result.logs);
    } catch (error: any) {
      console.error(error);
      addLogs([{
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: `Semantic Matching failed: ${error.message}`
      }]);
    } finally {
      setLoadingStates(prev => ({ ...prev, semanticMatch: false }));
    }
  };

  // Hackathon Preset Triggers
  const loadHackathonDemo = (type: 'jd' | 'resume' | 'both') => {
    const timestamp = () => new Date().toISOString();
    
    const demoJd: ExtractedArtifact = {
      source_type: 'jd',
      source_file: 'Staff_AI_Engineer_Google_JD.pdf',
      company: 'Google DeepMind',
      role: 'Staff AI Agent Architect',
      skills: [
        { skill_name: 'Python', category_code: 'COD', evidence: 'Primary programming language for models & frameworks', confidence: 'high' },
        { skill_name: 'PyTorch', category_code: 'AI', evidence: 'Designing and optimization of neural network frameworks', confidence: 'high' },
        { skill_name: 'Distributed Training', category_code: 'SYSD', evidence: 'Scale model fine-tuning on large GPU clusters', confidence: 'high' },
        { skill_name: 'Data Structures', category_code: 'DSA', evidence: 'Algorithmic efficiency is critical for sub-millisecond agents', confidence: 'high' },
        { skill_name: 'Docker / Kubernetes', category_code: 'CLOUD', evidence: 'Deploy microservice pipelines in production', confidence: 'medium' },
        { skill_name: 'System Design', category_code: 'SYSD', evidence: 'Architect scalable agent loops and messaging buses', confidence: 'high' },
        { skill_name: 'Technical Writing', category_code: 'COMM', evidence: 'Write clear design docs and research specs', confidence: 'medium' }
      ]
    };

    const demoResume: ExtractedArtifact = {
      source_type: 'resume',
      source_file: 'Rishal_Talent_CV.pdf',
      skills: [
        { skill_name: 'Python', category_code: 'COD', evidence: 'Built production backends and custom ML pipelines', confidence: 'high' },
        { skill_name: 'Algorithms', category_code: 'DSA', evidence: 'Competitive programming and optimized graph traversals', confidence: 'high' },
        { skill_name: 'Object-Oriented Design', category_code: 'OOD', evidence: 'Authored modular code using solid abstractions', confidence: 'high' },
        { skill_name: 'Gemini API Integration', category_code: 'AI', evidence: 'Built custom generative agents with function calling', confidence: 'high' },
        { skill_name: 'Docker', category_code: 'CLOUD', evidence: 'Containerized microservices and pushed to AWS ECR', confidence: 'medium' },
        { skill_name: 'SQL & Postgres', category_code: 'SQL', evidence: 'Optimized relational queries and materialized views', confidence: 'high' },
        { skill_name: 'Git & CI/CD', category_code: 'SWE', evidence: 'Managed branch releases and GitHub action workflows', confidence: 'high' }
      ]
    };

    const demoProfile: UnifiedCandidateProfile = {
      name: 'Rishal Agrawal',
      email: 'rishal.agrawal@radix.io',
      education: 'Master of Technology in Computer Science - IIT Bombay',
      skills: demoResume.skills,
      hackathons: ['Google Antigravity Hackathon Winner 2026', 'Smart India Hackathon Finalist'],
      internships: ['MTS Intern at Salesforce', 'AI Agent Engineer at HyperSpace'],
      certifications: ['AWS Solution Architect Professional', 'Google Cloud Certified Professional'],
      preferred_roles: ['Staff AI Engineer', 'Backend Architect'],
      cv_file: 'Rishal_Talent_CV.pdf'
    };

    if (type === 'jd' || type === 'both') {
      setJdData(demoJd);
      addLogs([{
        timestamp: timestamp(),
        level: 'INFO',
        message: `Loaded Hackathon Demo Job Description: [${demoJd.role}] at [${demoJd.company}]`
      }]);
    }
    
    if (type === 'resume' || type === 'both') {
      setResumeData(demoResume);
      setProfileData(demoProfile);
      addLogs([{
        timestamp: timestamp(),
        level: 'INFO',
        message: `Loaded Hackathon Demo Candidate Profile: [${demoProfile.name}]`
      }]);
    }

    addLogs([{
      timestamp: timestamp(),
      level: 'INFO',
      message: `Hackathon Preset injection complete. You can now execute Talent Checks or Semantic Matches.`
    }]);

    if (type === 'both') {
      setCurrentView('dashboard');
    } else if (type === 'jd') {
      setCurrentView('jd-analytics');
    } else {
      setCurrentView('profile-builder');
    }
  };

  return (
    <StateContext.Provider value={{
      currentView,
      setCurrentView,
      apiKey,
      setApiKey,
      jdData,
      resumeData,
      profileData,
      talentCheckReport,
      semanticMatchReport,
      agentLogs,
      loadingStates,
      parseJd,
      parseResume,
      updateProfile,
      saveProfileToSink,
      executeTalentCheck,
      executeSemanticMatch,
      loadHackathonDemo,
      clearAll
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useRadixState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useRadixState must be used within a StateEngineProvider');
  }
  return context;
};
