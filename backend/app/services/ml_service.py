from typing import Dict, List, Tuple, Any
import numpy as np
import re

HIGH_RISK_KEYWORDS = [
    "unlimited liability", "personally liable", "sole discretion", "without notice",
    "immediate termination", "forfeit", "penalty", "automatic renewal", "unilateral",
    "waive all rights", "irrevocable", "perpetual", "exclusive rights", "joint and several",
    "injunctive relief without bond", "indemnify and hold harmless against any and all",
    "liquidated damages", "waive jury trial", "class action waiver", "punitive damages",
    "exculpatory", "time is of the essence"
]

MEDIUM_RISK_KEYWORDS = [
    "terminate", "liquidated damages", "indemnify", "non-compete", "arbitration only",
    "limitation of liability", "as-is", "no warranty", "disclaims", "material breach",
    "confidentiality indefinitely", "restrictive covenant", "governing law in foreign jurisdiction",
    "assignment without consent", "non-solicitation", "remedies cumulative"
]

LOW_RISK_KEYWORDS = [
    "mutual agreement", "30 days notice", "60 days notice", "good faith",
    "both parties agree", "commercially reasonable efforts", "not unreasonably withheld",
    "cure period", "written notice", "mutual indemnification", "standard industry practice"
]

CATEGORY_RISK_MAP = {
    "Non-Compete": 0.85,
    "Liability": 0.80,
    "Termination": 0.60,
    "Intellectual Property": 0.65,
    "Warranties": 0.55,
    "Confidentiality": 0.45,
    "Payment": 0.40,
    "Force Majeure": 0.35,
    "Governing Law": 0.35,
    "Dispute Resolution": 0.45,
    "Obligations": 0.50,
    "Assignment": 0.55,
    "Severability": 0.25,
    "Amendments": 0.30,
}

def calculate_keyword_risk_score(clause_text: str) -> Tuple[float, str, List[str]]:
    """Calculates granular risk score based on presence of legal risk terms and mitigating clauses."""
    clause_lower = clause_text.lower()
    flagged_terms = []

    high_matches = []
    for kw in HIGH_RISK_KEYWORDS:
        if re.search(rf"\b{re.escape(kw)}\b", clause_lower):
            high_matches.append(kw)
            flagged_terms.append(kw)

    med_matches = []
    for kw in MEDIUM_RISK_KEYWORDS:
        if re.search(rf"\b{re.escape(kw)}\b", clause_lower):
            med_matches.append(kw)
            if kw not in flagged_terms:
                flagged_terms.append(kw)

    low_matches = []
    for kw in LOW_RISK_KEYWORDS:
        if re.search(rf"\b{re.escape(kw)}\b", clause_lower):
            low_matches.append(kw)

    high_count = len(high_matches)
    med_count = len(med_matches)
    low_count = len(low_matches)

    # Base raw score formula
    raw_score = 0.20 + (high_count * 0.30) + (med_count * 0.12) - (low_count * 0.08)
    # Length & complexity penalty (longer complex clauses usually hide liabilities)
    length_factor = min(0.15, len(clause_text) / 2500)
    score = min(1.0, max(0.10, raw_score + length_factor))

    level = "High" if score >= 0.65 else "Medium" if score >= 0.38 else "Low"
    return round(score * 100, 1), level, flagged_terms

def classify_clause(clause_text: str, category: str) -> Dict[str, Any]:
    """Classifies risk level, scores, and extracts flagged risk indicators."""
    risk_score, _, flagged_terms = calculate_keyword_risk_score(clause_text)
    category_base = CATEGORY_RISK_MAP.get(category, 0.45)
    adjusted = min(100.0, max(5.0, (risk_score * 0.65) + (category_base * 100 * 0.35)))

    level = "High" if adjusted >= 65 else "Medium" if adjusted >= 38 else "Low"
    return {
        "category": category,
        "risk_score": round(adjusted, 1),
        "risk_level": level,
        "flagged_terms": flagged_terms[:5]
    }

def analyze_clauses(clauses: List[Dict]) -> List[Dict]:
    """Process and annotate each clause with risk classification."""
    analyzed = []
    for clause in clauses:
        category = clause.get("primary_category", "Obligations")
        result = classify_clause(clause["text"], category)
        analyzed.append({**clause, **result})
    return analyzed

def calculate_overall_risk(analyzed_clauses: List[Dict]) -> Dict[str, Any]:
    """Calculate overall document risk metrics, distributions, and top risks."""
    if not analyzed_clauses:
        return {
            "overall_risk_score": 0.0,
            "risk_level": "Low",
            "high_risk_count": 0,
            "medium_risk_count": 0,
            "low_risk_count": 0,
            "high_risk_clauses": []
        }

    scores = [c["risk_score"] for c in analyzed_clauses]
    overall = float(np.mean(scores))

    # Weight towards highest risks if present
    high = [c for c in analyzed_clauses if c["risk_level"] == "High"]
    medium = [c for c in analyzed_clauses if c["risk_level"] == "Medium"]
    low = [c for c in analyzed_clauses if c["risk_level"] == "Low"]

    if high:
        # Boost document risk appropriately if critical high risk clauses exist
        max_high = max(c["risk_score"] for c in high)
        overall = (overall * 0.7) + (max_high * 0.3)

    overall = round(min(100.0, overall), 1)
    level = "High" if overall >= 65 else "Medium" if overall >= 38 else "Low"

    return {
        "overall_risk_score": overall,
        "risk_level": level,
        "high_risk_count": len(high),
        "medium_risk_count": len(medium),
        "low_risk_count": len(low),
        "high_risk_clauses": high[:8],
    }
