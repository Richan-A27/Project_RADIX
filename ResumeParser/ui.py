"""Streamlit UI for the Role 2 resume parser."""

from __future__ import annotations

import json
import logging
import tempfile
from pathlib import Path

import streamlit as st

from extract_text import ResumeTextExtractionError, extract_text
from parser import ResumeParsingError, parse_resume
from validator import ValidationError, validate_resume_json


logger = logging.getLogger(__name__)


def _configure_page() -> None:
    """Set up the Streamlit page and basic styling."""
    st.set_page_config(
        page_title="RADIX Resume Parser",
        page_icon="📄",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    st.markdown(
        """
        <style>
            .block-container {
                padding-top: 2rem;
                padding-bottom: 2rem;
                max-width: 1200px;
            }
            .hero {
                padding: 1.5rem 1.75rem;
                border-radius: 1.25rem;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
                color: white;
                margin-bottom: 1.5rem;
                box-shadow: 0 18px 50px rgba(15, 23, 42, 0.24);
            }
            .hero h1 {
                margin: 0;
                font-size: 2rem;
            }
            .hero p {
                margin: 0.35rem 0 0;
                opacity: 0.88;
                font-size: 1rem;
            }
            .card {
                padding: 1rem 1.1rem;
                border: 1px solid rgba(148, 163, 184, 0.25);
                border-radius: 1rem;
                background: rgba(255, 255, 255, 0.92);
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _render_hero() -> None:
    """Render the top-of-page intro block."""
    st.markdown(
        """
        <div class="hero">
            <h1>RADIX Resume Parser</h1>
            <p>Upload a resume, extract structured JSON, and preview the Role 2 output before Role 3 consumes it.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _save_uploaded_file(uploaded_file) -> Path:
    """Persist an uploaded resume to a temporary file for parsing."""
    suffix = Path(uploaded_file.name).suffix or ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(uploaded_file.getbuffer())
        return Path(temp_file.name)


def _run_pipeline(resume_path: Path) -> tuple[str, dict[str, object]]:
    """Run the extraction, parsing, and validation pipeline for a resume file."""
    resume_text = extract_text(str(resume_path))
    parsed_resume = parse_resume(resume_text=resume_text, filename=resume_path.name)
    validated_resume = validate_resume_json(parsed_resume)
    return resume_text, validated_resume


def main() -> None:
    """Render the Streamlit app."""
    _configure_page()
    _render_hero()

    st.sidebar.header("Controls")
    uploaded_file = st.sidebar.file_uploader(
        "Upload a resume",
        type=["pdf", "docx", "txt"],
        help="Supported formats: PDF, DOCX, TXT",
    )

    if uploaded_file is None:
        st.info("Upload a resume to extract structured JSON.")
        st.stop()

    temp_path = _save_uploaded_file(uploaded_file)

    try:
        resume_text, parsed_resume = _run_pipeline(temp_path)
    except ResumeTextExtractionError as exc:
        logger.exception("Resume text extraction failed")
        st.error(f"Text extraction failed: {exc}")
        st.stop()
    except ResumeParsingError as exc:
        logger.exception("Resume parsing failed")
        st.error(f"Parsing failed: {exc}")
        st.stop()
    except ValidationError as exc:
        logger.exception("Resume validation failed")
        st.error(f"Validation failed: {exc}")
        st.stop()
    except Exception as exc:  # pragma: no cover - UI safety net
        logger.exception("Unexpected UI failure")
        st.error(f"Unexpected error: {exc}")
        st.stop()
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)

    col_left, col_right = st.columns([1, 1])

    with col_left:
        st.subheader("Extracted Text")
        st.text_area("Resume text", resume_text, height=420)

    with col_right:
        st.subheader("Parsed JSON")
        json_text = json.dumps(parsed_resume, indent=2, ensure_ascii=False)
        st.code(json_text, language="json")
        st.download_button(
            label="Download JSON",
            data=json_text.encode("utf-8"),
            file_name="parsed_resume.json",
            mime="application/json",
        )


if __name__ == "__main__":
    main()