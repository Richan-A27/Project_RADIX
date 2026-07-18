import json
from typing import Dict, List, Any

COMPETENCY_TIERS = {
    "0-NONE": 0, "2-CU": 1, "3-CU": 2, "4-CU": 3, "4-AP": 4,
    "5-AP": 5, "6-AP": 6, "5-AS": 7, "6-AS": 8, "7-AS": 9,
    "8-AS": 10, "9-EV": 11
}

CATEGORY_MAP = {
    "cod": "coding",
    "coding": "coding",
    "dsa": "data_structures_and_algorithms",
    "data_structures_and_algorithms": "data_structures_and_algorithms",
    "ood": "object_oriented_programming_and_design",
    "object_oriented_programming_and_design": "object_oriented_programming_and_design",
    "apti": "aptitude_and_problem_solving",
    "aptitude_and_problem_solving": "aptitude_and_problem_solving",
    "comm": "communication_skills",
    "communication_skills": "communication_skills",
    "ai": "ai_native_engineering",
    "ai_native_engineering": "ai_native_engineering"
}

def map_confidence_to_level(confidence: str) -> str:
    """Fallback mapping if candidate_level is missing but confidence is provided."""
    conf = str(confidence).lower().strip()
    if conf == "high":
        return "7-AS"
    elif conf == "medium":
        return "6-AP"
    elif conf == "low":
        return "4-CU"
    return "0-NONE"

def run_talent_check(candidate_profile: Dict[str, Any], company_name: str, benchmarks: Dict[str, Dict[str, str]]) -> Dict[str, Any]:
    # Standardize company name search
    target_company = company_name.strip()
    company_key = target_company.lower()
    
    # Find matching benchmark
    company_row = None
    for k, v in benchmarks.items():
        if k.lower() == company_key:
            company_row = v
            target_company = v.get("companies", company_name)
            break
            
    if not company_row:
        # Try finding partial matches
        for k, v in benchmarks.items():
            if company_key in k.lower() or k.lower() in company_key:
                company_row = v
                target_company = v.get("companies", company_name)
                break
                
    if not company_row:
        # Fallback to default benchmark if company is not found
        company_row = {
            "coding": "6-AS",
            "data_structures_and_algorithms": "6-AS",
            "object_oriented_programming_and_design": "6-AP",
            "aptitude_and_problem_solving": "6-AS",
            "communication_skills": "6-AS",
            "ai_native_engineering": "4-CU"
        }

    # Map candidate skills to standard categories
    candidate_skills = {}
    for skill in candidate_profile.get("skills", []):
        cat_code = str(skill.get("category_code", "")).strip().lower()
        mapped_cat = CATEGORY_MAP.get(cat_code, cat_code)
        
        # Check if candidate_level is directly provided
        cand_lvl = skill.get("candidate_level")
        if not cand_lvl:
            # Fallback to confidence mapping
            cand_lvl = map_confidence_to_level(skill.get("confidence", "medium"))
            
        candidate_skills[mapped_cat] = cand_lvl

    expected_categories = [
        "coding", "data_structures_and_algorithms", "object_oriented_programming_and_design",
        "aptitude_and_problem_solving", "communication_skills", "ai_native_engineering"
    ]

    skillset_gap = []
    passed_categories = 0

    for category in expected_categories:
        required_str = str(company_row.get(category, "0-NONE")).strip()
        candidate_str = candidate_skills.get(category, "0-NONE").strip()

        req_val = COMPETENCY_TIERS.get(required_str, 0)
        cand_val = COMPETENCY_TIERS.get(candidate_str, 0)

        is_gap = cand_val < req_val
        if not is_gap:
            passed_categories += 1

        skillset_gap.append({
            "category_code": category,
            "required_level": required_str,
            "candidate_level": candidate_str,
            "gap": is_gap
        })

    readiness_score = int((passed_categories / len(expected_categories)) * 100)

    return {
        "company": target_company,
        "readiness_score": readiness_score,
        "skillset_gap": skillset_gap
    }
