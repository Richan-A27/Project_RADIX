"""
Talent Check / Matching Engine (Role 4)
"""
from typing import Dict, Any

def run_talent_match(jd_data: Dict[str, Any], resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare a parsed Job Description with a parsed Resume.
    """
    jd_skills = jd_data.get("skills", [])
    resume_skills = resume_data.get("skills", [])

    jd_categories = {s.get("category_code") for s in jd_skills if s.get("category_code")}
    resume_categories = {s.get("category_code") for s in resume_skills if s.get("category_code")}

    if not jd_categories:
        return {
            "readiness_score": 0,
            "skillset_gap": [],
            "message": "No skills found in Job Description."
        }

    overlap = jd_categories.intersection(resume_categories)
    missing = jd_categories.difference(resume_categories)

    readiness_score = int((len(overlap) / len(jd_categories)) * 100)

    skillset_gap = []
    for cat in jd_categories:
        is_gap = cat in missing
        skillset_gap.append({
            "category_code": cat,
            "gap": is_gap
        })

    return {
        "readiness_score": readiness_score,
        "skillset_gap": skillset_gap,
        "details": {
            "jd_required_categories": list(jd_categories),
            "candidate_categories": list(resume_categories),
            "missing_categories": list(missing),
        }
    }
