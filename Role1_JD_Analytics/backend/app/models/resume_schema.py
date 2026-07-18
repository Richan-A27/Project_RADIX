from pydantic import BaseModel, Field
from typing import List, Literal

class ExtractedSkill(BaseModel):
    skill_name: str = Field(description="The exact name of the technology or skill.")
    category_code: Literal["COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"] = Field(description="The mapped RADIX category code.")
    evidence: str = Field(description="A short direct quote or project context from the text showing this requirement or experience.")
    confidence: Literal["high", "medium", "low"] = Field(description="The confidence level of the extraction.")

class ResumeAnalysisResult(BaseModel):
    source_type: Literal["resume"] = Field(default="resume", description="Always 'resume' for resumes")
    source_file: str = Field(description="The filename of the processed document")
    company: str = Field(default="", description="Leave empty for resumes unless instructed otherwise")
    role: str = Field(default="", description="Leave empty for resumes unless instructed otherwise")
    skills: List[ExtractedSkill] = Field(description="List of extracted and mapped skills")
