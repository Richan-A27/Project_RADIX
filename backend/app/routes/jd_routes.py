"""
API routes for JD Analysis — Role 1 endpoints.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.jd_parser import extract_text
from app.services.jd_analyzer import analyze_jd
from app.services.supabase_client import (
    save_jd_analysis,
    get_all_analyses,
    get_analysis_by_id,
)

router = APIRouter(prefix="/api/v1/jd", tags=["JD Analytics"])


@router.post("/analyze")
async def analyze_job_description(file: UploadFile = File(...)):
    """
    Upload a JD file (PDF, DOCX, or TXT) and extract skills
    mapped to RADIX categories using Gemini AI.

    Returns the structured analysis result.
    """
    # Validate file type
    allowed_types = (".pdf", ".docx", ".txt")
    filename = file.filename or "unknown.txt"

    if not any(filename.lower().endswith(ext) for ext in allowed_types):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_types)}",
        )

    try:
        # Step 1: Read file bytes
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded")

        # Step 2: Extract text from file
        raw_text = extract_text(file_bytes, filename)

        if not raw_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the file. The file may be empty or image-based.",
            )

        # Step 3: Analyze with LangChain + Gemini
        analysis_result = analyze_jd(raw_text, filename)

        # Step 4: Save to Supabase
        saved_record = save_jd_analysis(analysis_result, raw_text)

        return {
            "status": "success",
            "message": f"Successfully analyzed {filename}",
            "data": saved_record,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        )


@router.post("/analyze-text")
async def analyze_text_input(payload: dict):
    """
    Analyze a plain text job description (pasted directly).
    Expects JSON body: { "text": "...", "source_name": "..." }
    """
    text = payload.get("text", "").strip()
    source_name = payload.get("source_name", "pasted_text.txt")

    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        analysis_result = analyze_jd(text, source_name)
        saved_record = save_jd_analysis(analysis_result, text)

        return {
            "status": "success",
            "message": "Successfully analyzed pasted text",
            "data": saved_record,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        )


@router.get("/analyses")
async def list_analyses():
    """Get all past JD analyses, newest first."""
    try:
        analyses = get_all_analyses()
        return {"status": "success", "data": analyses, "count": len(analyses)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get a specific JD analysis by ID."""
    try:
        analysis = get_analysis_by_id(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"status": "success", "data": analysis}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
