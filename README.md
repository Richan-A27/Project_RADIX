# RADIX Talent Match

AI-powered Talent Matching tool that analyzes job descriptions and maps required skills to 12 RADIX categories.

## Architecture

```
Frontend (React/Vite)  →  Backend (FastAPI)  →  Gemini AI (LangChain)
         ↓                      ↓
    User Interface         Supabase DB
```

## Quick Start

### 1. Setup Supabase
Run `supabase_schema.sql` in your [Supabase SQL Editor](https://cmijqmlwzhgqcisysmzl.supabase.co).

### 2. Get Gemini API Key (Free)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a free API key
3. Add it to `backend/.env` as `GOOGLE_API_KEY=your_key`

### 3. Start Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## RADIX Skill Categories

| Code | Category | Description |
|------|----------|-------------|
| COD | Coding | Programming languages |
| DSA | Data Structures & Algorithms | DS, algorithms, complexity |
| OOD | Object-Oriented Design | OOP, design patterns |
| APTI | Aptitude | Logic, reasoning |
| COMM | Communication | Written/verbal skills |
| AI | AI / ML | Machine learning, deep learning |
| CLOUD | Cloud | AWS, Azure, GCP, Docker |
| SQL | Databases | SQL, NoSQL, query optimization |
| SWE | Software Engineering | SDLC, testing, Git |
| SYSD | System Design | Scalable architectures |
| NETW | Networking | Protocols, security |
| OS | Operating Systems | Linux, shell, OS concepts |
| OTHER | Other | Uncategorized skills |

## Pipeline Role

This is **Role 1 (JD Analytics Agent)** in the RADIX pipeline. Its output JSON feeds into Role 5 (Skill Matching).
