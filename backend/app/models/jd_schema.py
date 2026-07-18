"""
Pydantic schemas for the JD Analytics extraction output.
Maps to the 12 RADIX skill categories.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class CategoryCode(str, Enum):
    """The 12 RADIX skill categories + OTHER."""
    COD = "COD"      # Coding / Programming
    DSA = "DSA"      # Data Structures & Algorithms
    OOD = "OOD"      # Object-Oriented Design
    APTI = "APTI"    # Aptitude / Logical Reasoning
    COMM = "COMM"    # Communication
    AI = "AI"        # Artificial Intelligence / ML
    CLOUD = "CLOUD"  # Cloud Computing
    SQL = "SQL"      # SQL / Databases
    SWE = "SWE"      # Software Engineering
    SYSD = "SYSD"    # System Design
    NETW = "NETW"    # Networking
    OS = "OS"        # Operating Systems
    OTHER = "OTHER"  # Doesn't fit the 12 categories


class SkillExtraction(BaseModel):
    """A single extracted skill from the JD."""
    skill_name: str = Field(
        description="The exact name of the technology or skill, e.g., 'Python', 'AWS', 'React'"
    )
    category_code: CategoryCode = Field(
        description="The RADIX category this skill maps to"
    )
    evidence: str = Field(
        description="A short direct quote from the JD text that shows this requirement"
    )
    confidence: str = Field(
        default="high",
        description="Confidence level: 'high', 'medium', or 'low'"
    )


class JDAnalysisResult(BaseModel):
    """The complete structured output from JD analysis."""
    source_type: str = Field(default="jd", description="Always 'jd' for job descriptions")
    source_file: str = Field(description="The filename of the uploaded JD")
    company: str = Field(description="The extracted company name from the JD")
    role: str = Field(description="The extracted job title from the JD")
    skills: List[SkillExtraction] = Field(
        description="List of all extracted skills mapped to RADIX categories"
    )


class JDAnalysisResponse(BaseModel):
    """API response wrapper for JD analysis."""
    id: Optional[str] = None
    source_type: str = "jd"
    source_file: str
    company: str
    role: str
    skills: List[SkillExtraction]
    created_at: Optional[str] = None
