import re
from typing import Dict, List, Any, Optional

_nlp = None
_spacy_checked = False

def get_nlp():
    """Attempt to load spaCy model with instant importlib check and graceful fallback to None."""
    global _nlp, _spacy_checked
    if _spacy_checked:
        return _nlp

    _spacy_checked = True
    import importlib.util
    has_model = (
        importlib.util.find_spec("en_core_web_sm") is not None or
        importlib.util.find_spec("en_core_web_lg") is not None
    )
    if not has_model:
        _nlp = None
        return None

    try:
        import spacy
        for model_name in ["en_core_web_sm", "en_core_web_lg"]:
            if importlib.util.find_spec(model_name) is not None:
                try:
                    _nlp = spacy.load(model_name)
                    return _nlp
                except Exception:
                    continue
    except Exception:
        _nlp = None
    return _nlp

CLAUSE_PATTERNS: Dict[str, List[str]] = {
    "Termination": [
        r"\bterminat\w*", r"\bcancel(?:lation)?\b", r"\bexpir\w*", r"\bend of agreement\b",
        r"\bterminate upon\b", r"\bnotice of termination\b", r"\bimmediate termination\b"
    ],
    "Payment": [
        r"\bpayment\s+(?:terms|due|schedule|obligations?|method)\b", r"\bnet\s+(?:30|60|90)\b",
        r"\binvoice\w*", r"\bfees?\s+(?:payable|schedule|amount)\b", r"\bcompensation\b", r"\bsalar(?:y|ies)\b",
        r"\breimburse\w*", r"\bpayable\s+within\b", r"\bbilling\s+(?:cycle|terms|schedule|dispute|period)\b"
    ],
    "Confidentiality": [
        r"\bconfidential\w*", r"\bnon-disclosure\b", r"\bnda\b", r"\bproprietary\b",
        r"\btrade secret\w*", r"\bconfidential information\b", r"\bnon-public\b"
    ],
    "Liability": [
        r"\bliabilit\w*", r"\bindemnif\w*", r"\bdamages\b", r"\bnegligence\b",
        r"\bhold harmless\b", r"\blimitation of liability\b", r"\bconsequential damages\b"
    ],
    "Intellectual Property": [
        r"\bintellectual property\b", r"\bcopyright\w*", r"\bpatent\w*", r"\btrademark\w*",
        r"\bwork made for hire\b", r"\binvention\w*", r"\blicens(?:e|or|ee)\b"
    ],
    "Governing Law": [
        r"\bgoverning law\b", r"\bjurisdiction\b", r"\bvenue\b", r"\bapplicable law\b",
        r"\bchoice of law\b", r"\bcourts of\b"
    ],
    "Dispute Resolution": [
        r"\barbitrat\w*", r"\bdispute\w*", r"\bmediation\b", r"\blitigat\w*",
        r"\bsettlement\b", r"\bcontroversy\b"
    ],
    "Force Majeure": [
        r"\bforce majeure\b", r"\bact of god\b", r"\bunforeseen\b", r"\bnatural disaster\b",
        r"\bwar\b", r"\bembargo\b", r"\bgovernment order\b"
    ],
    "Non-Compete": [
        r"\bnon-compete\b", r"\bnon-solicit\w*", r"\brestrictive covenant\b",
        r"\bcompetitive business\b", r"\brestraint of trade\b"
    ],
    "Obligations": [
        r"\bshall\b", r"\bmust\b", r"\brequired to\b", r"\bobligat\w*",
        r"\bagrees to\b", r"\bcovenant\w*", r"\bwill undertake\b"
    ],
    "Warranties": [
        r"\bwarrant\w*", r"\brepresent\w*", r"\bguarante\w*", r"\bas-is\b",
        r"\bdisclaimer of warranties\b", r"\bfitness for a particular purpose\b"
    ],
    "Amendments": [
        r"\bamend\w*", r"\bmodif\w*", r"\brevision\b", r"\bsupplement\w*",
        r"\bwritten consent\b", r"\bentire agreement\b"
    ],
    "Assignment": [
        r"\bassign\w*", r"\btransfer(?:red)?\b", r"\bdelegat\w*", r"\bsuccessors and assigns\b"
    ],
    "Severability": [
        r"\bseverab\w*", r"\binvalidity\b", r"\bunenforceable\b", r"\bremain in full force\b"
    ],
}

DATE_PATTERNS = [
    r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b",
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b",
    r"\b\d{1,2}(?:st|nd|rd|th)?\s+day of\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\b",
    r"\b(?:Q[1-4]|Quarter\s+[1-4])\s+\d{4}\b"
]

MONEY_PATTERNS = [
    r"\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|thousand))?",
    r"\b(?:USD|EUR|GBP|INR|CAD|AUD)\s*[\d,]+(?:\.\d{2})?",
    r"(?:€|£|₹)\s*[\d,]+(?:\.\d{2})?",
    r"\b(?:one|two|three|four|five|ten|twenty|fifty|hundred|thousand)\s+dollars\b"
]

KNOWN_GPE = {
    "Delaware", "New York", "California", "Texas", "Florida", "Illinois",
    "United States", "USA", "U.S.A.", "United Kingdom", "UK", "England",
    "Wales", "Canada", "Germany", "France", "India", "Singapore",
    "Ireland", "Switzerland", "Australia", "Japan", "Hong Kong"
}

LEGAL_ABBREVIATIONS = {
    "inc.", "llc.", "ltd.", "corp.", "co.", "v.", "vs.", "no.", "sec.", "art.",
    "para.", "cl.", "ex.", "i.e.", "e.g.", "viz.", "etc.", "u.s.", "u.k."
}

def split_into_sentences(text: str) -> List[str]:
    """Segment text into coherent sentences using spaCy or an advanced legal regex tokenizer."""
    nlp = get_nlp()
    if nlp is not None:
        try:
            doc = nlp(text[:120000])
            return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 20]
        except Exception:
            pass

    # High-accuracy fallback legal sentence tokenizer
    clean_text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Protect common legal abbreviations with temporary placeholders
    protected = clean_text
    abbrev_map = {}
    for i, abbrev in enumerate(LEGAL_ABBREVIATIONS):
        token = f"__ABBR_{i}__"
        abbrev_map[token] = abbrev
        protected = re.sub(re.escape(abbrev), token, protected, flags=re.IGNORECASE)

    raw_candidates = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'\(])|\n\s*\n+", protected)
    sentences = []
    for cand in raw_candidates:
        s = cand.strip()
        for token, abbrev in abbrev_map.items():
            s = s.replace(token, abbrev)
        s = re.sub(r"\s+", " ", s).strip()
        if len(s) >= 20 and not re.match(r"^Page \d+(?: of \d+)?$", s, re.IGNORECASE):
            sentences.append(s)

    return sentences

def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extract Named Entities (PERSON, ORG, GPE, DATE, MONEY, LAW)."""
    entities: Dict[str, List[str]] = {
        "PERSON": [], "ORG": [], "GPE": [], "DATE": [], "MONEY": [], "LAW": []
    }
    seen = {k: set() for k in entities}

    nlp = get_nlp()
    if nlp is not None:
        try:
            doc = nlp(text[:60000])
            for ent in doc.ents:
                lbl = ent.label_
                clean = ent.text.strip()
                if lbl in entities and clean not in seen[lbl] and len(clean) > 1:
                    entities[lbl].append(clean)
                    seen[lbl].add(clean)
        except Exception:
            pass

    # Regex extraction layer (augments spaCy and acts as robust zero-dependency engine)
    # Dates
    for pat in DATE_PATTERNS:
        for match in re.finditer(pat, text, re.IGNORECASE):
            dt = match.group(0).strip()
            if dt not in seen["DATE"] and len(dt) > 3:
                entities["DATE"].append(dt)
                seen["DATE"].add(dt)

    # Money
    for pat in MONEY_PATTERNS:
        for match in re.finditer(pat, text, re.IGNORECASE):
            m = match.group(0).strip()
            if m not in seen["MONEY"] and len(m) > 1:
                entities["MONEY"].append(m)
                seen["MONEY"].add(m)

    # GPE (Jurisdictions & Locations)
    for gpe in KNOWN_GPE:
        if re.search(rf"\b{re.escape(gpe)}\b", text, re.IGNORECASE) and gpe not in seen["GPE"]:
            entities["GPE"].append(gpe)
            seen["GPE"].add(gpe)

    # Organizations (Legal suffix patterns)
    org_pattern = r"\b([A-Z][A-Za-z0-9&.,\s]{1,40}\s+(?:Inc\.|LLC|Ltd\.|Corp\.|Corporation|Limited|Company|LLP|Bank|Technologies|Services|Group|Holdings))\b"
    for match in re.finditer(org_pattern, text):
        org = match.group(1).strip().rstrip(".,")
        if org not in seen["ORG"] and len(org) > 3:
            entities["ORG"].append(org)
            seen["ORG"].add(org)

    # Persons (Common contract representation patterns)
    person_patterns = [
        r"\b(?:by|name|signatory|authorized representative|representative)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b",
        r"\b(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b"
    ]
    for pat in person_patterns:
        for match in re.finditer(pat, text, re.IGNORECASE):
            person = match.group(1).strip()
            if person not in seen["PERSON"] and len(person) > 3:
                entities["PERSON"].append(person)
                seen["PERSON"].add(person)

    # Laws & Statutes
    law_patterns = [
        r"\b(?:Section|Sec\.)\s+\d+[\w\.\(\)]*\b",
        r"\b(?:General Corporation Law|Securities Act|Exchange Act|GDPR|HIPAA|UCC|Uniform Commercial Code)\b",
        r"\bTitle\s+[0-9IVXLCDM]+\b"
    ]
    for pat in law_patterns:
        for match in re.finditer(pat, text, re.IGNORECASE):
            law = match.group(0).strip()
            if law not in seen["LAW"]:
                entities["LAW"].append(law)
                seen["LAW"].add(law)

    return entities

def extract_parties(text: str, entities: Dict) -> List[Dict[str, str]]:
    """Extract contracting parties with their contractual role."""
    parties: List[Dict[str, str]] = []
    seen = set()

    # Pattern 1: Preamble parties e.g. "between X, hereinafter referred to as..."
    preamble_patterns = [
        r'(?:between|by and between)\s+([A-Z][^,\n]+?)(?:,\s*|\s+hereinafter|\s+\(["\']|\s+and\b)',
        r'(?:and)\s+([A-Z][^,\n]+?)(?:,\s*|\s+hereinafter|\s+\(["\']|\s+individually\b)',
    ]
    for pat in preamble_patterns:
        for match in re.finditer(pat, text):
            candidate = match.group(1).strip().strip('"\'')
            candidate = re.sub(r'^(?:a|an)\s+', '', candidate, flags=re.IGNORECASE)
            if candidate and len(candidate) > 3 and len(candidate) < 60 and candidate not in seen:
                parties.append({"name": candidate, "type": "Contracting Party"})
                seen.add(candidate)

    # Pattern 2: Explicit role designations
    role_patterns = [
        (r'("Company"|"Employer"|"Client"|"Buyer"|"Licensor"|"Disclosing Party")\s*[:=\-]\s*([A-Z][A-Za-z0-9\s.,]+)', "Primary Party"),
        (r'("Employee"|"Contractor"|"Vendor"|"Seller"|"Licensee"|"Receiving Party")\s*[:=\-]\s*([A-Z][A-Za-z0-9\s.,]+)', "Counterparty"),
    ]
    for pat, role in role_patterns:
        for match in re.finditer(pat, text):
            candidate = match.group(2).strip().rstrip(".,")
            if candidate and candidate not in seen and len(candidate) > 2:
                parties.append({"name": candidate, "type": role})
                seen.add(candidate)

    # Augment with discovered ORGs
    for org in entities.get("ORG", [])[:6]:
        if org not in seen and len(org) > 3:
            parties.append({"name": org, "type": "Organization"})
            seen.add(org)

    # Fallback to general counterparty if none found
    if not parties:
        for p in entities.get("PERSON", [])[:3]:
            if p not in seen:
                parties.append({"name": p, "type": "Individual"})
                seen.add(p)

    return parties[:10]

def extract_dates(text: str) -> List[Dict[str, str]]:
    """Extract dates with contextual snippet."""
    dates: List[Dict[str, str]] = []
    seen = set()
    for pattern in DATE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            date_str = match.group(0).strip()
            if date_str not in seen:
                start = max(0, match.start() - 60)
                end = min(len(text), match.end() + 60)
                context = text[start:end].replace("\n", " ").strip()
                dates.append({"date": date_str, "context": f"...{context}..."})
                seen.add(date_str)
    return dates[:20]

def detect_clauses(text: str) -> List[Dict[str, Any]]:
    """Detect and categorize legal clauses across sentences."""
    sentences = split_into_sentences(text)
    clauses: List[Dict[str, Any]] = []

    for sentence in sentences:
        sentence_lower = sentence.lower()
        matched_categories = []
        for category, patterns in CLAUSE_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, sentence_lower):
                    matched_categories.append(category)
                    break

        if matched_categories:
            clauses.append({
                "text": sentence,
                "categories": matched_categories,
                "primary_category": matched_categories[0]
            })

    return clauses[:60]

def extract_obligations(text: str) -> List[str]:
    """Extract mandatory and binding legal obligations."""
    sentences = split_into_sentences(text)
    obligation_kws = [
        "shall", "must", "is required to", "obligated to",
        "agrees to", "covenants to", "will ensure", "undertakes to",
        "shall not", "is prohibited from"
    ]
    obligations = []
    for s in sentences:
        s_lower = s.lower()
        if any(re.search(rf"\b{re.escape(kw)}\b", s_lower) for kw in obligation_kws):
            obligations.append(s)
    return obligations[:25]

def process_document(text: str) -> Dict[str, Any]:
    """Execute complete end-to-end NLP document pipeline."""
    entities = extract_entities(text)
    parties = extract_parties(text, entities)
    dates = extract_dates(text)
    clauses = detect_clauses(text)
    obligations = extract_obligations(text)

    return {
        "entities": entities,
        "parties": parties,
        "dates": dates,
        "clauses": clauses,
        "obligations": obligations,
        "clause_count": len(clauses),
        "obligation_count": len(obligations),
        "engine": "spaCy + Legal NLP Suite" if get_nlp() is not None else "Legal NLP Rule Engine"
    }


LEGAL_SIGNALS = [
    "agreement", "whereas", "hereinafter", "party", "parties", "shall", "contract",
    "obligations", "governing law", "jurisdiction", "indemnif", "liability",
    "termination", "effective date", "consideration", "executed", "witnesseth",
    "covenant", "breach", "arbitration"
]

NON_LEGAL_SIGNALS = [
    "nitte.edu.in", "lecture", "chapter", "slide", "university", "professor",
    "course", "assignment", "exam", "healthcare analytics", "patient", "clinical",
    "ehr", "electronic health", "hospital", "radiology", "immunization"
]

_DOC_TYPE_PATTERNS: List[tuple] = [
    (r"non-disclosure|nda", "Non-Disclosure Agreement (NDA)"),
    (r"employment|employee|employer|executive", "Employment Agreement"),
    (r"master services|msa|consulting", "Master Services Agreement"),
    (r"lease|tenancy|landlord|tenant", "Lease Agreement"),
    (r"license|licensor|licensee|software", "License Agreement"),
    (r"service agreement|services agreement", "Service Agreement"),
]


def classify_document_type(text: str) -> dict:
    """
    Classifies whether a document is a legal contract and infers its type.

    Returns:
        {
            "is_legal_contract": bool,
            "document_type": str,
            "confidence": float,
            "warning": str | None
        }
    """
    sample = text[:3000].lower()

    legal_score = sum(1 for signal in LEGAL_SIGNALS if signal in sample)
    non_legal_score = sum(1 for signal in NON_LEGAL_SIGNALS if signal in sample)

    # Non-legal / academic content detected
    if non_legal_score >= 3:
        return {
            "is_legal_contract": False,
            "document_type": "Academic / Educational Content",
            "confidence": round(min(0.5 + non_legal_score * 0.08, 0.98), 2),
            "warning": (
                "Notice: This document appears to be educational or non-contractual content, not a legal contract. "
                "Risk analysis may not be meaningful."
            ),
        }

    # Strongly legal
    if legal_score >= 4:
        # Infer specific document type
        document_type = "Legal Contract"
        for pattern, dtype in _DOC_TYPE_PATTERNS:
            if re.search(pattern, sample):
                document_type = dtype
                break
        confidence = round(min(0.5 + legal_score * 0.05, 0.99), 2)
        return {
            "is_legal_contract": True,
            "document_type": document_type,
            "confidence": confidence,
            "warning": None,
        }

    # Ambiguous
    return {
        "is_legal_contract": True,
        "document_type": "Unknown Document",
        "confidence": round(0.3 + legal_score * 0.05, 2),
        "warning": (
            "Notice: This document may not be a standard legal contract. "
            "Results should be reviewed carefully."
        ),
    }
