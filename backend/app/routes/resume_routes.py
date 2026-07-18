"""
API routes for Resume Parsing — Role 2 endpoints.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.jd_parser import extract_text
from app.services.resume_analyzer import analyze_resume
from app.services.supabase_client import (
    save_resume_analysis,
    get_all_resume_analyses,
    get_resume_analysis_by_id,
)

router = APIRouter(prefix="/api/v1/resume", tags=["Resume Parsing"])


@router.post("/parse")
async def parse_resume_file(file: UploadFile = File(...)):
    """
    Upload a Resume file (PDF, DOCX, or TXT) and extract skills
    mapped to RADIX categories using Gemini AI.
    """
    allowed_types = (".pdf", ".docx", ".txt")
    filename = file.filename or "unknown.txt"

    if not any(filename.lower().endswith(ext) for ext in allowed_types):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_types)}",
        )

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        raw_text = extract_text(file_bytes, filename)
        if not raw_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the file.",
            )

        analysis_result = analyze_resume(raw_text, filename)
        saved_record = save_resume_analysis(analysis_result, raw_text)

        return {
            "status": "success",
            "message": f"Successfully parsed {filename}",
            "data": saved_record,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Parsing failed: {str(e)}",
        )


@router.post("/parse-text")
async def parse_text_input(payload: dict):
    """
    Analyze a plain text resume (pasted directly).
    Expects JSON body: { "text": "...", "source_name": "..." }
    """
    text = payload.get("text", "").strip()
    source_name = payload.get("source_name", "pasted_resume.txt")

    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        analysis_result = analyze_resume(text, source_name)
        saved_record = save_resume_analysis(analysis_result, text)

        return {
            "status": "success",
            "message": "Successfully parsed pasted resume text",
            "data": saved_record,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Parsing failed: {str(e)}",
        )


@router.get("/analyses")
async def list_resume_analyses():
    """Get all past Resume analyses, newest first."""
    try:
        analyses = get_all_resume_analyses()
        return {"status": "success", "data": analyses, "count": len(analyses)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyses/{analysis_id}")
async def get_resume_analysis(analysis_id: str):
    """Get a specific Resume analysis by ID."""
    try:
        analysis = get_resume_analysis_by_id(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"status": "success", "data": analysis}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
