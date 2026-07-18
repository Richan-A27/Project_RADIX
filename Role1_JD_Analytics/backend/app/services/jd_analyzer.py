"""
JD Analyzer service — uses LangChain + Google Gemini to extract
skills from job descriptions and map them to RADIX categories.

Flow: Raw text → LangChain prompt → Gemini (free tier) → Structured JSON
"""
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from app.models.jd_schema import JDAnalysisResult
from app.config import get_settings

# The detailed system prompt that instructs Gemini on RADIX extraction
SYSTEM_PROMPT = """You are an expert AI recruiter specialized in analyzing job descriptions.

Your task is to read the provided unstructured job description text and map the requirements
onto the 12 RADIX skill categories. If a required skill doesn't fit these categories, use OTHER.

## The 12 RADIX Skill Categories:

1. **COD** (Coding/Programming) — General programming languages and coding ability.
   Examples: Python, Java, C++, JavaScript, TypeScript, Go, Rust, Ruby, PHP, Swift, Kotlin

2. **DSA** (Data Structures & Algorithms) — Knowledge of data structures, algorithms,
   complexity analysis. Examples: Arrays, Trees, Graphs, Sorting, Dynamic Programming

3. **OOD** (Object-Oriented Design) — OOP concepts, design patterns, SOLID principles.
   Examples: Inheritance, Polymorphism, Factory Pattern, Observer Pattern, MVC

4. **APTI** (Aptitude) — Logical reasoning, quantitative ability, problem-solving.
   Examples: Analytical thinking, mathematical modeling, statistics

5. **COMM** (Communication) — Written/verbal communication, presentation skills.
   Examples: Technical writing, documentation, stakeholder communication, English proficiency

6. **AI** (Artificial Intelligence / ML) — Machine learning, deep learning, NLP, computer vision.
   Examples: TensorFlow, PyTorch, scikit-learn, LLMs, GPT, neural networks, data science

7. **CLOUD** (Cloud Computing) — Cloud platforms, containerization, serverless, DevOps.
   Examples: AWS, Azure, GCP, Docker, Kubernetes, Terraform, CI/CD

8. **SQL** (SQL / Databases) — Relational and non-relational databases, query optimization.
   Examples: MySQL, PostgreSQL, MongoDB, Redis, database design, query optimization

9. **SWE** (Software Engineering) — SDLC, testing, version control, agile, code review.
   Examples: Git, Agile/Scrum, unit testing, code review, CI/CD pipelines, TDD

10. **SYSD** (System Design) — Designing scalable systems, architecture patterns.
    Examples: Microservices, load balancing, caching, message queues, distributed systems

11. **NETW** (Networking) — Computer networks, protocols, security.
    Examples: TCP/IP, HTTP/HTTPS, DNS, firewalls, VPN, REST APIs, gRPC

12. **OS** (Operating Systems) — OS concepts, Linux administration, shell scripting.
    Examples: Linux, Windows Server, shell scripting, process management, memory management

13. **OTHER** — Skills that don't fit the above categories.
    Examples: Domain expertise, specific tools, project management, leadership

## Instructions:
- Focus heavily on sections like "Key Responsibilities", "Requirements", "What We're Looking For",
  "Qualifications", and "Skills Required".
- Extract EVERY distinct skill or technology mentioned.
- For each skill, provide a SHORT direct quote from the text as evidence.
- Set confidence to "high" if the skill is explicitly required, "medium" if preferred/nice-to-have,
  and "low" if only implied or tangentially mentioned.
- Extract the company name and job title from the text.
- If company or role cannot be determined, use "Unknown".

You MUST respond with a single valid JSON object matching this exact schema:
{{
  "source_type": "jd",
  "source_file": "{source_file}",
  "company": "<extracted company name>",
  "role": "<extracted job title>",
  "skills": [
    {{
      "skill_name": "<exact name of tech/skill>",
      "category_code": "<one of: COD, DSA, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS, OTHER>",
      "evidence": "<short direct quote from the text>",
      "confidence": "<high, medium, or low>"
    }}
  ]
}}

IMPORTANT: Return ONLY the JSON object. No markdown, no backticks, no explanation."""

HUMAN_PROMPT = """Analyze this job description and extract all skills mapped to RADIX categories:

---
{jd_text}
---"""


def analyze_jd(jd_text: str, source_file: str) -> JDAnalysisResult:
    """
    Analyze a job description using LangChain + Gemini.

    Args:
        jd_text: The raw text extracted from the JD file.
        source_file: The original filename for reference.

    Returns:
        JDAnalysisResult with extracted skills mapped to RADIX categories.
    """
    settings = get_settings()

    # Initialize Gemini via LangChain
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        google_api_key=settings.google_api_key,
        temperature=0,
        convert_system_message_to_human=False,
    )

    # Build the prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", HUMAN_PROMPT),
    ])

    # Create and invoke the chain
    chain = prompt | llm

    response = chain.invoke({
        "source_file": source_file,
        "jd_text": jd_text,
    })

    # Parse the LLM response into our Pydantic model
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

    # Clean up potential markdown wrappers the LLM might add despite instructions
    if response_text.startswith("```"):
        # Remove ```json and ``` wrappers
        lines = response_text.split("\n")
        # Remove first line (```json) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        response_text = "\n".join(lines)

    parsed_data = json.loads(response_text)
    result = JDAnalysisResult(**parsed_data)

    return result
