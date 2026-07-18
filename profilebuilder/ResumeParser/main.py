"""CLI entrypoint for the Role 2 resume parsing workflow."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from extract_text import ResumeTextExtractionError, UnsupportedFileTypeError, extract_text
from parser import ResumeParsingError, parse_resume
from validator import ValidationError, validate_resume_json

OUTPUT_FILENAME = "parsed_resume.json"
OUTPUT_DIRNAME = "output"
logger = logging.getLogger(__name__)


def _configure_logging() -> None:
    """Configure user-friendly console logging for the CLI."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def _resolve_resume_path() -> Path:
    """Prompt the user for a resume path until a valid file is supplied."""
    while True:
        raw_path = input("Enter the path to the resume file: ").strip().strip('"')
        if not raw_path:
            logger.warning("Please provide a valid file path.")
            continue

        path = Path(raw_path).expanduser()
        if path.exists() and path.is_file():
            return path.resolve()

        logger.warning("File not found: %s", path)


def main() -> None:
    """Run the complete Role 2 parsing workflow."""
    _configure_logging()
    resume_path = _resolve_resume_path()

    try:
        resume_text = extract_text(str(resume_path))
        parsed_resume = parse_resume(resume_text=resume_text, filename=resume_path.name)
        validated_resume = validate_resume_json(parsed_resume)
    except (
        ResumeTextExtractionError,
        ResumeParsingError,
        UnsupportedFileTypeError,
        ValidationError,
        FileNotFoundError,
        ValueError,
    ) as exc:
        logger.error("Resume parsing failed: %s", exc)
        raise SystemExit(1) from exc

    output_dir = Path(__file__).resolve().parent / OUTPUT_DIRNAME
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / OUTPUT_FILENAME

    output_file.write_text(
        json.dumps(validated_resume, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    logger.info("Resume parsed successfully.")


if __name__ == "__main__":
    main()
