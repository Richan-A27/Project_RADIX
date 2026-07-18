import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables (.env contains GEMINI_API_KEY)
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

// Configure Multer for in-memory uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define active Gemini model (Gemini 3.5 Flash is standard for the new keys)
const ACTIVE_GEMINI_MODEL = 'gemini-3.5-flash';

// Database mock container (acting as the Supabase data sink)
const mockSupabaseSink = {
  profiles: []
};

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

/**
 * Safely parses JSON strings returned by LLM agents.
 * Auto-cleans markdown decoration backticks if present.
 */
function safeJsonParse(text) {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, '');
    cleanText = cleanText.replace(/```$/, '');
  }
  return JSON.parse(cleanText.trim());
}

/**
 * Text extraction utility for docx, pdf, or raw text streams.
 */
async function extractTextFromFile(file) {
  if (!file) return '';
  const extension = file.originalname.split('.').pop().toLowerCase();
  
  if (extension === 'pdf') {
    const data = await pdf(file.buffer);
    return data.text;
  } else if (extension === 'docx') {
    const data = await mammoth.extractRawText({ buffer: file.buffer });
    return data.value;
  }
  
  return file.buffer.toString('utf-8');
}

/**
 * Agent logging standard for dashboard feedback.
 */
function createAgentLogs(subsystem, entries = []) {
  const timestamp = () => new Date().toISOString();
  return [
    { timestamp: timestamp(), level: 'INFO', message: `Initializing Antigravity Agent Orchestrator: [${subsystem}]` },
    ...entries.map(e => ({ timestamp: timestamp(), level: e.level || 'INFO', message: e.message })),
    { timestamp: timestamp(), level: 'INFO', message: `Subsystem [${subsystem}] execution finished with code 200.` }
  ];
}

// Heuristics for simulated parsing fallback
function runSimulatedJdParser(text, fileName) {
  const lowercaseText = text.toLowerCase();
  const extractedSkills = [];
  
  const rules = {
    'COD': ['python', 'javascript', 'typescript', 'java', 'c++', 'rust', 'golang', 'coding'],
    'DSA': ['data structures', 'algorithms', 'trees', 'graphs', 'sorting', 'complexity'],
    'OOD': ['object-oriented', 'oop', 'design patterns', 'solid principles'],
    'APTI': ['problem-solving', 'aptitude', 'logic', 'analytical'],
    'COMM': ['communication', 'teamwork', 'collaboration', 'verbal', 'written'],
    'AI': ['machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'llm', 'gemini'],
    'CLOUD': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'cloud'],
    'SQL': ['sql', 'postgresql', 'mysql', 'database', 'nosql', 'mongodb'],
    'SWE': ['git', 'ci/cd', 'testing', 'jest', 'scrum', 'agile'],
    'SYSD': ['system design', 'scalability', 'microservices', 'distributed systems'],
    'NETW': ['tcp/ip', 'http', 'grpc', 'networking'],
    'OS': ['linux', 'windows', 'threading', 'kernel']
  };

  Object.entries(rules).forEach(([cat, keywords]) => {
    keywords.forEach(kw => {
      if (lowercaseText.includes(kw)) {
        extractedSkills.push({
          skill_name: kw.charAt(0).toUpperCase() + kw.slice(1),
          category_code: cat,
          evidence: `Extracted keyword "${kw}" from job parameters.`,
          confidence: 'high'
        });
      }
    });
  });

  return {
    source_type: 'jd',
    source_file: fileName || 'jd_document.pdf',
    company: text.match(/(?:at|company)\s+([A-Z][a-zA-Z\s]{1,15})/)?.[1]?.trim() || 'Google DeepMind',
    role: text.match(/(?:role|position|title):\s*([A-Za-z\s]{2,25})/i)?.[1]?.trim() || 'Software Engineer',
    skills: extractedSkills.slice(0, 8)
  };
}

function runSimulatedResumeParser(text, fileName) {
  const lowercaseText = text.toLowerCase();
  const extractedSkills = [];
  
  const rules = {
    'COD': ['python', 'javascript', 'typescript', 'react', 'java', 'c++'],
    'DSA': ['algorithms', 'data structures', 'graphs'],
    'OOD': ['oop', 'design patterns', 'solid'],
    'COMM': ['communication', 'presented', 'team lead'],
    'AI': ['machine learning', 'pytorch', 'llm', 'openai', 'gemini'],
    'CLOUD': ['aws', 'docker', 'kubernetes', 'gcp'],
    'SQL': ['sql', 'postgres', 'mongodb', 'supabase'],
    'SWE': ['git', 'github', 'unit tests', 'agile']
  };

  Object.entries(rules).forEach(([cat, keywords]) => {
    keywords.forEach(kw => {
      if (lowercaseText.includes(kw)) {
        extractedSkills.push({
          skill_name: kw.toUpperCase(),
          category_code: cat,
          evidence: `Resume quote matching capability "${kw}".`,
          confidence: 'high'
        });
      }
    });
  });

  return {
    source_type: 'resume',
    source_file: fileName || 'candidate_cv.pdf',
    name: text.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)/)?.[0] || 'Alex Mercer',
    email: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'alex.mercer@radix.io',
    education: text.match(/(?:Bachelor|B\.S\.|M\.S\.|Degree)\s+in\s+([A-Za-z\s]{2,30})/i)?.[0]?.trim() || 'B.S. in Computer Science',
    skills: extractedSkills.slice(0, 10),
    hackathons: ['RADIX Talent Match Hackathon 2026'],
    internships: ['MTS Intern at Salesforce'],
    certifications: ['Antigravity Certified Developer'],
    preferred_roles: ['Staff AI Engineer']
  };
}

// ----------------------------------------------------------------------
// ENDPOINTS
// ----------------------------------------------------------------------

// 1. JD Parser API
app.post('/api/parse-jd', upload.single('file'), async (req, res) => {
  const logTracker = [];
  try {
    let text = req.body.text || '';
    let fileName = 'raw_text_input.txt';

    if (req.file) {
      fileName = req.file.originalname;
      logTracker.push({ message: `Received uploaded JD file "${fileName}".` });
      text = await extractTextFromFile(req.file);
      logTracker.push({ message: `Extracted ${text.length} characters from binary stream.` });
    } else {
      logTracker.push({ message: `Received raw text input for JD (${text.length} chars).` });
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Job description content is empty.' });
    }

    const key = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
    
    if (key) {
      try {
        logTracker.push({ message: `Gemini key found. Dispatching parsing agent via [${ACTIVE_GEMINI_MODEL}]...` });
        const ai = new GoogleGenerativeAI(key);
        const model = ai.getGenerativeModel({ model: ACTIVE_GEMINI_MODEL });
        
        const prompt = `
          Analyze this Job Description. Extract skills and map each onto the 12 RADIX categories:
          [COD, DSA, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS] or [OTHER].
          
          Job Description:
          ${text}
          
          Return JSON schema matches:
          {
            "company": "Company Name (string)",
            "role": "Role Title (string)",
            "skills": [
              {
                "skill_name": "Skill",
                "category_code": "DSA|COD|...",
                "evidence": "justifying text quote",
                "confidence": "high|medium|low"
              }
            ]
          }
        `;

        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: "object",
              properties: {
                company: { type: "string" },
                role: { type: "string" },
                skills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill_name: { type: "string" },
                      category_code: { type: "string" },
                      evidence: { type: "string" },
                      confidence: { type: "string" }
                    },
                    required: ["skill_name", "category_code", "evidence", "confidence"]
                  }
                }
              },
              required: ["company", "role", "skills"]
            }
          }
        });

        const responseText = response.response.text();
        logTracker.push({ message: 'JSON response received from Gemini.' });

        const parsed = safeJsonParse(responseText);
        return res.json({
          data: {
            source_type: 'jd',
            source_file: fileName,
            company: parsed.company || 'Unknown Company',
            role: parsed.role || 'Software Engineer',
            skills: parsed.skills || []
          },
          logs: createAgentLogs('JD_ANALYTICS', logTracker)
        });
      } catch (apiErr) {
        logTracker.push({ level: 'WARNING', message: `Gemini API call failed (${apiErr.message}). Gracefully falling back to parser heuristics...` });
        const data = runSimulatedJdParser(text, fileName);
        await new Promise(r => setTimeout(r, 1200));
        return res.json({
          data,
          logs: createAgentLogs('JD_ANALYTICS', logTracker)
        });
      }
    } else {
      logTracker.push({ level: 'WARNING', message: 'No API key configured. Executing parser heuristics fallback...' });
      const data = runSimulatedJdParser(text, fileName);
      
      // Deliberate timer for hackathon feedback
      await new Promise(r => setTimeout(r, 1200));
      return res.json({
        data,
        logs: createAgentLogs('JD_ANALYTICS', logTracker)
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
      logs: createAgentLogs('JD_ANALYTICS', [{ level: 'ERROR', message: `Unhandled crash: ${err.message}` }])
    });
  }
});

// 2. Resume Parser API
app.post('/api/parse-resume', upload.single('file'), async (req, res) => {
  const logTracker = [];
  try {
    let text = req.body.text || '';
    let fileName = 'resume_input.txt';

    if (req.file) {
      fileName = req.file.originalname;
      logTracker.push({ message: `Received uploaded resume "${fileName}".` });
      text = await extractTextFromFile(req.file);
      logTracker.push({ message: `Extracted ${text.length} characters from PDF/Word file.` });
    } else {
      logTracker.push({ message: `Received raw text input for resume (${text.length} chars).` });
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Resume description content is empty.' });
    }

    const key = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
    
    if (key) {
      try {
        logTracker.push({ message: `Gemini key found. Launching CV parser agent via [${ACTIVE_GEMINI_MODEL}]...` });
        const ai = new GoogleGenerativeAI(key);
        const model = ai.getGenerativeModel({ model: ACTIVE_GEMINI_MODEL });
        
        const prompt = `
          Analyze this Resume. Extract metadata and skills categorized into the 12 RADIX classes.
          
          Resume text:
          ${text}
          
          Return JSON schema matches:
          {
            "name": "Full Name",
            "email": "Email Address",
            "education": "Degree credentials",
            "skills": [
              {
                "skill_name": "Skill",
                "category_code": "COD|DSA|...",
                "evidence": "source text quote",
                "confidence": "high|medium|low"
              }
            ],
            "hackathons": ["hackathon names"],
            "internships": ["intern roles"],
            "certifications": ["certs"],
            "preferred_roles": ["roles"]
          }
        `;

        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                education: { type: "string" },
                skills: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill_name: { type: "string" },
                      category_code: { type: "string" },
                      evidence: { type: "string" },
                      confidence: { type: "string" }
                    },
                    required: ["skill_name", "category_code", "evidence", "confidence"]
                  }
                },
                hackathons: { type: "array", items: { type: "string" } },
                internships: { type: "array", items: { type: "string" } },
                certifications: { type: "array", items: { type: "string" } },
                preferred_roles: { type: "array", items: { type: "string" } }
              },
              required: ["name", "email", "education", "skills", "hackathons", "internships", "certifications", "preferred_roles"]
            }
          }
        });

        const responseText = response.response.text();
        logTracker.push({ message: 'JSON response received from Gemini.' });

        const parsed = safeJsonParse(responseText);
        return res.json({
          data: {
            ...parsed,
            cv_file: fileName
          },
          logs: createAgentLogs('RESUME_PARSING', logTracker)
        });
      } catch (apiErr) {
        logTracker.push({ level: 'WARNING', message: `Gemini API call failed (${apiErr.message}). Gracefully falling back to parser heuristics...` });
        const data = runSimulatedResumeParser(text, fileName);
        await new Promise(r => setTimeout(r, 1200));
        return res.json({
          data,
          logs: createAgentLogs('RESUME_PARSING', logTracker)
        });
      }
    } else {
      logTracker.push({ level: 'WARNING', message: 'No API key configured. Executing parser heuristics fallback...' });
      const data = runSimulatedResumeParser(text, fileName);
      
      await new Promise(r => setTimeout(r, 1200));
      return res.json({
        data,
        logs: createAgentLogs('RESUME_PARSING', logTracker)
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
      logs: createAgentLogs('RESUME_PARSING', [{ level: 'ERROR', message: `Unhandled crash: ${err.message}` }])
    });
  }
});

// 3. Semantic Job Fit Alignment API
app.post('/api/semantic-match', async (req, res) => {
  const logTracker = [];
  try {
    const { jd, profile } = req.body;
    logTracker.push({ message: 'Initializing semantic matching comparison.' });

    if (!jd || !profile) {
      return res.status(400).json({ error: 'Required comparison inputs (JD, profile) are missing.' });
    }

    const key = process.env.GEMINI_API_KEY || req.headers['x-goog-api-key'];

    if (key) {
      try {
        logTracker.push({ message: `Gemini key found. Launching alignment agent via [${ACTIVE_GEMINI_MODEL}]...` });
        const ai = new GoogleGenerativeAI(key);
        const model = ai.getGenerativeModel({ model: ACTIVE_GEMINI_MODEL });

        const prompt = `
          Compare the Required Job Skills against the Candidate Profile.
          Match capabilities conceptually (e.g. synonym matching: "Python scripting" aligns with "Python development").

          Required Job Skills:
          ${JSON.stringify(jd.skills, null, 2)}

          Candidate Profile:
          ${JSON.stringify({ name: profile.name, skills: profile.skills, education: profile.education, certifications: profile.certifications }, null, 2)}

          Compute a final match score (0-100), list matched strengths, and list missing gaps.
          
          Return JSON schema matches:
          {
            "match_score": 85,
            "matched_skills": ["Matched capability (synonym justification in parentheses)"],
            "missing_skills": ["Missing requirement (category in parentheses)"]
          }
        `;

        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { 
            responseMimeType: 'application/json',
            responseSchema: {
              type: "object",
              properties: {
                match_score: { type: "integer" },
                matched_skills: { type: "array", items: { type: "string" } },
                missing_skills: { type: "array", items: { type: "string" } }
              },
              required: ["match_score", "matched_skills", "missing_skills"]
            }
          }
        });

        const responseText = response.response.text();
        logTracker.push({ message: 'JSON response received from Gemini.' });

        const parsed = safeJsonParse(responseText);
        return res.json({
          data: {
            jd_source_file: jd.source_file || 'job_description.pdf',
            match_score: parsed.match_score || 0,
            matched_skills: parsed.matched_skills || [],
            missing_skills: parsed.missing_skills || []
          },
          logs: createAgentLogs('SKILL_MATCHING', logTracker)
        });
      } catch (apiErr) {
        logTracker.push({ level: 'WARNING', message: `Gemini API call failed (${apiErr.message}). Gracefully falling back to matching heuristics...` });
        
        const matched_skills = [];
        const missing_skills = [];

        jd.skills.forEach(jdSkill => {
          const matchedSkillObj = profile.skills.find(
            ps => ps.skill_name.toLowerCase() === jdSkill.skill_name.toLowerCase() ||
                  ps.category_code === jdSkill.category_code
          );

          if (matchedSkillObj) {
            if (matchedSkillObj.skill_name.toLowerCase() === jdSkill.skill_name.toLowerCase()) {
              matched_skills.push(`${matchedSkillObj.skill_name} (Direct Match)`);
            } else {
              matched_skills.push(`${matchedSkillObj.skill_name} (Conceptual Match for ${jdSkill.skill_name} under category ${jdSkill.category_code})`);
            }
          } else {
            missing_skills.push(`${jdSkill.skill_name} (${jdSkill.category_code} category missing)`);
          }
        });

        const ratio = jd.skills.length ? matched_skills.length / jd.skills.length : 1;
        const match_score = Math.min(100, Math.round(ratio * 100) + (profile.hackathons.length ? 10 : 0));

        await new Promise(r => setTimeout(r, 1000));
        return res.json({
          data: {
            jd_source_file: jd.source_file || 'job_description.pdf',
            match_score,
            matched_skills,
            missing_skills
          },
          logs: createAgentLogs('SKILL_MATCHING', logTracker)
        });
      }
    } else {
      logTracker.push({ level: 'WARNING', message: 'No API key configured. Executing fallback comparison algorithms...' });
      
      const matched_skills = [];
      const missing_skills = [];

      jd.skills.forEach(jdSkill => {
        const matchedSkillObj = profile.skills.find(
          ps => ps.skill_name.toLowerCase() === jdSkill.skill_name.toLowerCase() ||
                ps.category_code === jdSkill.category_code
        );

        if (matchedSkillObj) {
          if (matchedSkillObj.skill_name.toLowerCase() === jdSkill.skill_name.toLowerCase()) {
            matched_skills.push(`${matchedSkillObj.skill_name} (Direct Match)`);
          } else {
            matched_skills.push(`${matchedSkillObj.skill_name} (Conceptual Match for ${jdSkill.skill_name} under category ${jdSkill.category_code})`);
          }
        } else {
          missing_skills.push(`${jdSkill.skill_name} (${jdSkill.category_code} category missing)`);
        }
      });

      const ratio = jd.skills.length ? matched_skills.length / jd.skills.length : 1;
      const match_score = Math.min(100, Math.round(ratio * 100) + (profile.hackathons.length ? 10 : 0));

      await new Promise(r => setTimeout(r, 1000));
      return res.json({
        data: {
          jd_source_file: jd.source_file || 'job_description.pdf',
          match_score,
          matched_skills,
          missing_skills
        },
        logs: createAgentLogs('SKILL_MATCHING', logTracker)
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
      logs: createAgentLogs('SKILL_MATCHING', [{ level: 'ERROR', message: `Unhandled crash: ${err.message}` }])
    });
  }
});

// 4. Supabase Sync Simulator
app.post('/api/profiles', (req, res) => {
  const profile = req.body;
  if (!profile || !profile.email) {
    return res.status(400).json({ error: 'Profile must contain an email address.' });
  }

  const idx = mockSupabaseSink.profiles.findIndex(p => p.email === profile.email);
  if (idx >= 0) {
    mockSupabaseSink.profiles[idx] = { ...mockSupabaseSink.profiles[idx], ...profile, updated_at: new Date() };
  } else {
    mockSupabaseSink.profiles.push({ ...profile, created_at: new Date() });
  }

  res.json({
    success: true,
    message: 'Candidate profile successfully pushed to Supabase mock data sink.',
    data: profile
  });
});

app.get('/api/profiles', (req, res) => {
  res.json({
    success: true,
    data: mockSupabaseSink.profiles
  });
});

// Launch server listener
app.listen(port, () => {
  console.log(`RADIX Backend running on http://localhost:${port}`);
});
