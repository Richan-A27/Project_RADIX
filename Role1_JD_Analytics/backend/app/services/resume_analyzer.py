"""
Resume Analyzer service — uses LangChain + Google Gemini to extract
skills from resumes and map them to RADIX categories.
"""
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from app.models.resume_schema import ResumeAnalysisResult
from app.config import get_settings

SYSTEM_PROMPT = """You are an advanced applicant tracking system (ATS) parser. Your task is to extract structured skills, technical signals, and core profile data from an unstructured candidate resume text.

Map all discovered skills into the 12 RADIX categories: COD, DSA, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS, or OTHER.

Build tolerance for varying layout formats, headings, bullet styles, multi-column resumes, and partial or noisy text extracted from PDF/DOCX files.

You MUST respond with a single, valid JSON object containing no markdown wrappers and no conversational text.

Output JSON Schema:
{
  "source_type": "resume",
  "source_file": "<filename_of_the_resume>",
  "company": "",
  "role": "",
  "skills": [
    {
      "skill_name": "<extracted skill name>",
      "category_code": "<appropriate RADIX category code>",
      "evidence": "<short phrase or project context from the resume>",
      "confidence": "high"
    }
  ]
}

Extraction Rules:
- Extract only what is supported by the resume text.
- Prefer concise skill names and clear evidence phrases.
- Normalize skills into the RADIX category that best matches their primary function.
- If a skill can fit multiple categories, choose the most relevant one.
- Use OTHER only when no RADIX category fits.
- Keep company and role empty here; Role 3 will enrich the profile later.
- Return an empty skills array if nothing reliable is found, but still return valid JSON.

Category Guidance:
- COD: coding languages and core programming ability
- DSA: algorithms, data structures, complexity, problem solving
- OOD: object-oriented design, design patterns, architecture
- APTI: aptitude, reasoning, quantitative problem solving
- COMM: communication, presentation, teamwork, leadership
- AI: machine learning, deep learning, NLP, AI tools, LLMs
- CLOUD: AWS, Azure, GCP, Docker, Kubernetes, DevOps cloud stack
- SQL: SQL, databases, queries, database design, data modeling
- SWE: software engineering, testing, CI/CD, SDLC, debugging
- SYSD: system design, distributed systems, scalability, backend architecture
- NETW: networking, protocols, TCP/IP, routing, sockets
- OS: operating systems, concurrency, threads, memory management
- OTHER: skills that do not fit the above

Validation Rules:
- Output must be strict JSON.
- Do not include explanations, bullets, code fences, or markdown.
- Do not invent skills, projects, or credentials.
- Preserve enough evidence so Role 3 can trust and reuse the extracted items.
"""

HUMAN_PROMPT = """
Source File: {source_file}

Extract skills from the following resume text and map them to RADIX categories in the requested JSON format.

---
{resume_text}
---"""

def analyze_resume(resume_text: str, source_file: str) -> ResumeAnalysisResult:
    """
    Analyze a resume using LangChain + Gemini.
    """
    settings = get_settings()

    # Initialize Gemini via LangChain
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        google_api_key=settings.google_api_key,
        temperature=0,
        convert_system_message_to_human=False,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", HUMAN_PROMPT),
    ])

    chain = prompt | llm

    response = chain.invoke({
        "source_file": source_file,
        "resume_text": resume_text,
    })

    content = response.content
    if isinstance(content, list):
        parts = []
        for p in content:
            if isinstance(p, dict) and "text" in p:
                parts.append(p["text"])
            elif isinstance(p, str):
                parts.append(p)
        response_text = "".join(parts).strip()
    else:
        response_text = str(content).strip()

    if response_text.startswith("```"):
        lines = response_text.split("\\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        response_text = "\\n".join(lines)

    parsed_data = json.loads(response_text)
    result = ResumeAnalysisResult(**parsed_data)

    return result
