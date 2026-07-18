import os
import json
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from matcher import match_skills
from talent_check import run_talent_check

app = FastAPI(title="RADIX Skill Matching & Talent Check API")

# Enable CORS for React frontend (development and integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper functions to load local mock database files
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PROFILES_FILE = os.path.join(DATA_DIR, "profiles.json")
JDS_FILE = os.path.join(DATA_DIR, "jds.json")
BENCHMARKS_FILE = os.path.join(DATA_DIR, "talent_check_benchmarks.json")

def load_profiles() -> List[Dict[str, Any]]:
    try:
        if not os.path.exists(PROFILES_FILE):
            return []
        with open(PROFILES_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading profiles: {e}")
        return []

def load_jds() -> List[Dict[str, Any]]:
    try:
        if not os.path.exists(JDS_FILE):
            return []
        with open(JDS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading JDs: {e}")
        return []

def load_benchmarks() -> Dict[str, Dict[str, str]]:
    try:
        if not os.path.exists(BENCHMARKS_FILE):
            return {}
        with open(BENCHMARKS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading benchmarks: {e}")
        return {}

class MatchRequest(BaseModel):
    candidate_id: Optional[int] = None
    jd_id: Optional[int] = None
    candidate_data: Optional[Dict[str, Any]] = None
    jd_data: Optional[Dict[str, Any]] = None

class TalentCheckRequest(BaseModel):
    candidate_id: Optional[int] = None
    candidate_data: Optional[Dict[str, Any]] = None
    company_name: str

@app.get("/")
def read_root():
    return {"status": "online", "message": "RADIX Skill Matching & Talent Check Backend API is running"}

@app.get("/api/candidates")
def get_candidates():
    profiles = load_profiles()
    # Return minimal summary for dropdown list
    return [
        {
            "id": idx,
            "name": p.get("name"),
            "email": p.get("email"),
            "preferred_roles": p.get("preferred_roles", []),
            "skills_count": len(p.get("skills", []))
        }
        for idx, p in enumerate(profiles)
    ]

@app.get("/api/candidates/{candidate_id}")
def get_candidate(candidate_id: int):
    profiles = load_profiles()
    if candidate_id < 0 or candidate_id >= len(profiles):
        raise HTTPException(status_code=404, detail="Candidate not found")
    return profiles[candidate_id]

@app.get("/api/jds")
def get_jds():
    jds = load_jds()
    return [
        {
            "id": idx,
            "company": j.get("company"),
            "role": j.get("role"),
            "source_file": j.get("source_file"),
            "skills_count": len(j.get("skills", []))
        }
        for idx, j in enumerate(jds)
    ]

@app.get("/api/jds/{jd_id}")
def get_jd(jd_id: int):
    jds = load_jds()
    if jd_id < 0 or jd_id >= len(jds):
        raise HTTPException(status_code=404, detail="JD not found")
    return jds[jd_id]

@app.get("/api/companies")
def get_companies():
    benchmarks = load_benchmarks()
    return list(benchmarks.keys())

@app.post("/api/match")
def match_candidate_jd(req: MatchRequest):
    # Resolve candidate profile
    candidate_profile = None
    if req.candidate_data is not None:
        candidate_profile = req.candidate_data
    elif req.candidate_id is not None:
        profiles = load_profiles()
        if 0 <= req.candidate_id < len(profiles):
            candidate_profile = profiles[req.candidate_id]
            
    # Resolve JD skills list
    jd_profile = None
    if req.jd_data is not None:
        jd_profile = req.jd_data
    elif req.jd_id is not None:
        jds = load_jds()
        if 0 <= req.jd_id < len(jds):
            jd_profile = jds[req.jd_id]
            
    if not candidate_profile:
        raise HTTPException(status_code=400, detail="Invalid candidate selection or missing candidate data")
    if not jd_profile:
        raise HTTPException(status_code=400, detail="Invalid JD selection or missing JD data")
        
    try:
        # Perform matching
        results = match_skills(candidate_profile, jd_profile)
        # Add metadata for UI display
        results["candidate_name"] = candidate_profile.get("name", "Unknown Candidate")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match error: {str(e)}")

@app.post("/api/talent-check")
def talent_check(req: TalentCheckRequest):
    # Resolve candidate profile
    candidate_profile = None
    if req.candidate_data is not None:
        candidate_profile = req.candidate_data
    elif req.candidate_id is not None:
        profiles = load_profiles()
        if 0 <= req.candidate_id < len(profiles):
            candidate_profile = profiles[req.candidate_id]
            
    if not candidate_profile:
        raise HTTPException(status_code=400, detail="Invalid candidate selection or missing candidate data")
        
    try:
        benchmarks = load_benchmarks()
        result = run_talent_check(candidate_profile, req.company_name, benchmarks)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Talent Check error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
