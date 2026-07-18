from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import List, Optional
import json
import uuid
from datetime import datetime
from app.services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/v1/profile", tags=["Profile Builder"])

@router.post("/submit")
async def submit_profile(
    name: str = Form(...),
    email: str = Form(...),
    linkedin: Optional[str] = Form(None),
    github: Optional[str] = Form(None),
    portfolio: Optional[str] = Form(None),
    final_skills: str = Form(...),  # JSON string of skills array
    resume: UploadFile = File(...)
):
    """Save a candidate profile to Supabase."""
    client = get_supabase_client()
    
    try:
        skills = json.loads(final_skills)
    except Exception:
        skills = []
        
    file_name = f"{uuid.uuid4()}_{resume.filename}" if resume else None

    record = {
        "name": name,
        "email": email,
        "linkedin_url": linkedin,
        "github_url": github,
        "portfolio_url": portfolio,
        "preferred_roles": ["Software Engineer", "Full Stack Developer"], # Hardcoded for now
        "skills": skills,
        "resume_file_path": file_name,
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        response = client.table("candidate_profiles").insert(record).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/candidates")
async def get_candidates():
    """Fetch all candidate profiles."""
    client = get_supabase_client()
    try:
        response = client.table("candidate_profiles").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
