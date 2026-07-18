# RADIX Role 2 - Resume Parsing

This project implements Role 2 of the RADIX Talent Match pipeline. It accepts a resume in PDF, DOCX, or TXT format, extracts the text, sends it to OpenAI using the Role 2 system prompt, validates the returned JSON, and saves the result to `output/parsed_resume.json`.

## Requirements

- Python 3.11
- OpenAI API key

## Installation

1. Install Python 3.11 if it is not already available.
2. Create and activate a virtual environment.

Windows:

```bash
py -3.11 -m venv .venv
.venv\Scripts\activate
```

macOS / Linux:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment Setup

Copy `.env.example` to `.env` and set your OpenAI credentials:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_SECONDS=60
MAX_RESUME_TEXT_CHARS=40000
```

You can change `OPENAI_MODEL`, `OPENAI_TIMEOUT_SECONDS`, and `MAX_RESUME_TEXT_CHARS` without modifying the code.

## Running the Project

Run the CLI entrypoint:

```bash
python main.py
```

Enter the path to a resume file when prompted. The parsed result will be saved to:

```bash
output/parsed_resume.json
```

## Output Shape

The parser expects JSON in the following structure:

```json
{
  "source_type": "resume",
  "source_file": "resume.pdf",
  "company": "",
  "role": "",
  "skills": [
    {
      "skill_name": "Python",
      "category_code": "COD",
      "evidence": "Developed ML project",
      "confidence": "high"
    }
  ]
}
```

Example saved output:

```json
{
  "source_type": "resume",
  "source_file": "sample_resume.txt",
  "company": "",
  "role": "",
  "skills": [
    {
      "skill_name": "Python",
      "category_code": "COD",
      "evidence": "Built an ML project",
      "confidence": "high"
    }
  ]
}
```

## Notes

- `extract_text.py` handles PDF, DOCX, and TXT input.
- `parser.py` uses the modern OpenAI Python SDK.
- `parser.py` includes retry handling, prompt-injection hardening, response cleanup, and schema validation.
- `validator.py` enforces the required JSON schema before saving.
- This implementation is designed so Role 3 can consume the parsed output directly.
