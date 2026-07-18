"""
API routes for Talent Check / Matching — Role 4 endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.supabase_client import get_analysis_by_id, get_resume_analysis_by_id
from app.services.talent_check_service import run_talent_match

router = APIRouter(prefix="/api/v1/match", tags=["Talent Check"])

class MatchRequest(BaseModel):
    jd_id: str
    resume_id: str

@router.post("/")
async def match_talent_endpoint(request: MatchRequest):
    """
    Compare a parsed JD with a parsed Resume by their Supabase IDs.
    """
    jd_record = get_analysis_by_id(request.jd_id)
    if not jd_record:
        raise HTTPException(status_code=404, detail="Job Description analysis not found")

    resume_record = get_resume_analysis_by_id(request.resume_id)
    if not resume_record:
        raise HTTPException(status_code=404, detail="Resume analysis not found")

    try:
        match_result = run_talent_match(jd_record, resume_record)
        return {
            "status": "success",
            "data": match_result,
            "candidate": resume_record.get("source_file"),
            "job": jd_record.get("source_file")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
