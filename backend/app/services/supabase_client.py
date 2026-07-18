"""
Supabase client service — handles saving and retrieving JD analyses.
"""
from supabase import create_client, Client
from app.config import get_settings
from app.models.jd_schema import JDAnalysisResult
from app.models.resume_schema import ResumeAnalysisResult


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def save_jd_analysis(result: JDAnalysisResult, raw_text: str = "") -> dict:
    """
    Save a JD analysis result to Supabase.

    Args:
        result: The structured analysis result from LangChain.
        raw_text: The raw extracted text (stored for reference).

    Returns:
        The inserted record from Supabase.
    """
    client = get_supabase_client()

    # Convert skills to list of dicts for JSONB storage
    skills_data = [skill.model_dump() for skill in result.skills]

    record = {
        "source_type": result.source_type,
        "source_file": result.source_file,
        "company": result.company,
        "role": result.role,
        "skills": skills_data,
        "raw_text": raw_text,
    }

    response = client.table("jd_analyses").insert(record).execute()

    if response.data:
        return response.data[0]
    return record


def get_all_analyses() -> list:
    """Fetch all JD analyses from Supabase, newest first."""
    client = get_supabase_client()
    response = (
        client.table("jd_analyses")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def get_analysis_by_id(analysis_id: str) -> dict | None:
    """Fetch a single JD analysis by its ID."""
    client = get_supabase_client()
    response = (
        client.table("jd_analyses")
        .select("*")
        .eq("id", analysis_id)
        .single()
        .execute()
    )
    return response.data


def save_resume_analysis(result: ResumeAnalysisResult, raw_text: str = "") -> dict:
    """
    Save a Resume analysis result to Supabase.
    """
    client = get_supabase_client()

    skills_data = [skill.model_dump() for skill in result.skills]

    record = {
        "source_type": result.source_type,
        "source_file": result.source_file,
        "company": result.company,
        "role": result.role,
        "skills": skills_data,
        "raw_text": raw_text,
    }

    response = client.table("resume_analyses").insert(record).execute()

    if response.data:
        return response.data[0]
    return record


def get_all_resume_analyses() -> list:
    """Fetch all Resume analyses from Supabase, newest first."""
    client = get_supabase_client()
    response = (
        client.table("resume_analyses")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


def get_resume_analysis_by_id(analysis_id: str) -> dict | None:
    """Fetch a single Resume analysis by its ID."""
    client = get_supabase_client()
    response = (
        client.table("resume_analyses")
        .select("*")
        .eq("id", analysis_id)
        .single()
        .execute()
    )
    return response.data
