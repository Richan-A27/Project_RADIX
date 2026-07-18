import re
from typing import Dict, List, Any, Tuple
from rapidfuzz import fuzz

# Common aliases mapping for fuzzy matching
ALIAS_MAP = {
    "dsa": ["data structures", "algorithms", "data structures and algorithms", "data structures & algorithms"],
    "oop": ["object-oriented programming", "ood", "object-oriented design", "object oriented programming", "object oriented design"],
    "gcp": ["google cloud platform", "google cloud", "google cloud platform (gcp)"],
    "aws": ["amazon web services", "amazon web services (aws)"],
    "azure": ["microsoft azure", "azure cloud"],
    "js": ["javascript", "js/ts"],
    "ts": ["typescript", "js/ts"],
    "ml": ["machine learning", "ml/ai"],
    "ai": ["artificial intelligence", "ml/ai", "deep learning", "neural networks"],
    "sql": ["sql database", "relational database", "databases", "mysql", "postgresql", "pl/sql", "oracle sql", "sql server"],
    "swe": ["software engineering", "software development", "software dev", "best practices", "rest apis", "unit testing", "git", "github"],
    "sysd": ["system design", "distributed systems", "system architecture", "scalability"],
    "netw": ["networking", "network engineering", "tcp/ip", "protocols", "tcp/ip networking"],
    "os": ["operating system", "linux", "unix", "windows", "windows server", "kernel", "linux shell scripting", "shell scripting"]
}

def normalize_text(text: str) -> str:
    """Normalize text for consistent comparison: lower case, strip, remove punctuation."""
    if not text:
        return ""
    text = text.lower().strip()
    # Remove special chars but keep spaces, plus, sharp (for C++, C#)
    text = re.sub(r'[^a-z0-9\s+#]', '', text)
    return text

def check_alias_match(norm_cand: str, norm_jd: str) -> bool:
    """Check if the candidate skill and JD skill are known aliases of each other."""
    # Check candidates aliases
    for key, aliases in ALIAS_MAP.items():
        # If candidate matches the short key, and JD matches one of the aliases, or vice versa
        if norm_cand == key and any(norm_jd == normalize_text(a) for a in aliases):
            return True
        if norm_jd == key and any(norm_cand == normalize_text(a) for a in aliases):
            return True
        # If both are aliases of the same key
        if any(norm_cand == normalize_text(a) for a in aliases) and any(norm_jd == normalize_text(a) for a in aliases):
            return True
    return False

def calculate_similarity(cand_name: str, jd_name: str) -> float:
    """Calculate the similarity score between candidate and JD skill name."""
    norm_cand = normalize_text(cand_name)
    norm_jd = normalize_text(jd_name)
    
    # Exact check
    if norm_cand == norm_jd:
        return 100.0
        
    # Alias check
    if check_alias_match(norm_cand, norm_jd):
        return 95.0
        
    # Standard fuzzy score
    score = fuzz.token_sort_ratio(norm_cand, norm_jd)
    return float(score)

def match_skills(candidate_profile: Dict[str, Any], jd_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare a candidate profile against a JD skill list.
    Returns match score, matched skills details, and missing skills details.
    """
    cand_skills = candidate_profile.get("skills", [])
    jd_skills = jd_data.get("skills", [])
    
    if not jd_skills:
        return {
            "jd_source_file": jd_data.get("source_file", ""),
            "company": jd_data.get("company", ""),
            "role": jd_data.get("role", ""),
            "match_score": 100,
            "matched_skills": [],
            "missing_skills": [],
            "category_scores": {}
        }
        
    matched_skills = []
    missing_skills = []
    
    total_jd_skills = len(jd_skills)
    matched_weight_sum = 0.0
    
    # Track which candidate skills have been matched to avoid reusing them
    used_cand_indices = set()
    
    # For each skill required by the JD
    for jd_skill in jd_skills:
        jd_name = jd_skill.get("skill_name", "")
        jd_cat = jd_skill.get("category_code", "OTHER")
        
        best_match = None
        best_score = 0.0
        best_cand_idx = -1
        
        # Compare with each of candidate's skills
        for idx, cand_skill in enumerate(cand_skills):
            if idx in used_cand_indices:
                continue
                
            cand_name = cand_skill.get("skill_name", "")
            sim = calculate_similarity(cand_name, jd_name)
            
            # If similarity is above 80%, we consider it a potential match
            if sim >= 80.0 and sim > best_score:
                best_score = sim
                best_match = cand_skill
                best_cand_idx = idx
                
        if best_match:
            # We found a match!
            used_cand_indices.add(best_cand_idx)
            confidence = best_match.get("confidence", "medium")
            
            # Confidence weighting factor
            conf_weight = 1.0
            if confidence == "medium":
                conf_weight = 0.85
            elif confidence == "low":
                conf_weight = 0.6
                
            matched_weight_sum += conf_weight
            
            # Store matched skill with detailed context
            matched_skills.append({
                "skill_name": jd_name,
                "category_code": jd_cat,
                "jd_evidence": jd_skill.get("evidence", ""),
                "candidate_evidence": best_match.get("evidence", ""),
                "candidate_confidence": confidence,
                "match_confidence": best_match.get("confidence", "medium"),
                "similarity": round(best_score, 1)
            })
        else:
            # No match found, it is missing
            missing_skills.append({
                "skill_name": jd_name,
                "category_code": jd_cat,
                "evidence": jd_skill.get("evidence", "")
            })
            
    # Calculate match score (0 - 100)
    match_score = (matched_weight_sum / total_jd_skills) * 100
    # Cap between 0 and 100 and round
    match_score = max(0.0, min(100.0, match_score))
    match_score = round(match_score, 1)
    
    # Calculate category wise score for UI breakdown
    # Categories: DSA|COD|OOD|APTI|COMM|AI|CLOUD|SQL|SWE|SYSD|NETW|OS|OTHER
    categories = ["DSA", "COD", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"]
    category_scores = {}
    
    for cat in categories:
        # Get required skills in this category
        req_in_cat = [s for s in jd_skills if s.get("category_code") == cat]
        if not req_in_cat:
            continue
            
        matched_in_cat = [s for s in matched_skills if s.get("category_code") == cat]
        # Calculate level/score in this category
        cat_score = (len(matched_in_cat) / len(req_in_cat)) * 100
        category_scores[cat] = {
            "required": len(req_in_cat),
            "matched": len(matched_in_cat),
            "score": round(cat_score, 1)
        }
        
    return {
        "jd_source_file": jd_data.get("source_file", ""),
        "company": jd_data.get("company", ""),
        "role": jd_data.get("role", ""),
        "match_score": match_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "category_scores": category_scores
    }
