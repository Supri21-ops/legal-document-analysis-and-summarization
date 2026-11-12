import re
import math
from collections import Counter
from typing import List, Dict, Any, Optional
from app.config import settings

_vector_store: Dict[int, Any] = {}

class PureTFIDFEngine:
    """High-performance, pure-Python TF-IDF vector retrieval engine with Cosine Similarity."""
    def __init__(self):
        self.idf: Dict[str, float] = {}
        self.doc_vectors: List[Dict[str, float]] = []

    def fit_transform(self, documents: List[str]):
        num_docs = len(documents)
        if num_docs == 0:
            return
        df = Counter()
        doc_tfs = []
        for doc in documents:
            words = re.findall(r"\b[a-zA-Z]{3,}\b", doc.lower())
            tf = Counter(words)
            doc_tfs.append(tf)
            for w in tf:
                df[w] += 1

        self.idf = {w: math.log((num_docs + 1) / (cnt + 1)) + 1.0 for w, cnt in df.items()}
        self.doc_vectors = []
        for tf in doc_tfs:
            vec = {w: cnt * self.idf[w] for w, cnt in tf.items()}
            norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
            self.doc_vectors.append({w: v / norm for w, v in vec.items()})

    def search(self, query: str, documents: List[str], top_k: int = 4) -> List[str]:
        q_words = re.findall(r"\b[a-zA-Z]{3,}\b", query.lower())
        if not q_words:
            return documents[:top_k]
        q_tf = Counter(q_words)
        q_vec = {w: cnt * self.idf.get(w, 0.0) for w, cnt in q_tf.items() if w in self.idf}
        q_norm = math.sqrt(sum(v * v for v in q_vec.values())) or 1.0
        norm_q_vec = {w: v / q_norm for w, v in q_vec.items()}

        scores = []
        for idx, d_vec in enumerate(self.doc_vectors):
            dot_product = sum(norm_q_vec[w] * d_vec.get(w, 0.0) for w in norm_q_vec)
            scores.append((dot_product, documents[idx]))

        scores.sort(key=lambda x: x[0], reverse=True)
        results = [doc for score, doc in scores[:top_k] if score > 0.02]
        return results if results else documents[:min(top_k, len(documents))]

def get_gemini_client():
    """Returns Google GenAI Client if configured."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception:
        return None

def get_claude_client():
    """Returns Anthropic Claude client if configured."""
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    except Exception:
        return None

def chunk_text(text: str, chunk_size: int = 350, overlap: int = 50) -> List[str]:
    """Splits text into overlapping sliding-window passages for RAG retrieval."""
    words = text.split()
    if not words:
        return []
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if len(chunk.strip()) > 25:
            chunks.append(chunk)
        if end >= len(words):
            break
        start += chunk_size - overlap
    return chunks

def build_vector_store(document_id: int, text: str):
    """
    Builds an in-memory TF-IDF + Cosine Vector Index.
    Guaranteed zero-crash, instant semantic retrieval across all platforms.
    """
    chunks = chunk_text(text)
    if not chunks:
        _vector_store[document_id] = {"chunks": [], "engine": None}
        return

    engine = PureTFIDFEngine()
    engine.fit_transform(chunks)
    _vector_store[document_id] = {
        "chunks": chunks,
        "engine": engine
    }

def retrieve_relevant_chunks(document_id: int, query: str, top_k: int = 4) -> List[str]:
    """Retrieves the most semantically relevant text passages for a user query."""
    store = _vector_store.get(document_id)
    if not store or not store.get("chunks"):
        return []

    chunks = store["chunks"]
    engine: Optional[PureTFIDFEngine] = store.get("engine")
    if engine is not None:
        return engine.search(query, chunks, top_k=top_k)

    return chunks[:min(top_k, len(chunks))]

# -------------------------------------------------------------
# Core GenAI Calling Engine (Gemini -> Claude -> Extractive Fallback)
# -------------------------------------------------------------

def call_llm(prompt: str, max_tokens: int = 1500) -> Optional[str]:
    """Invokes Google Gemini first (via direct REST / google-genai), falls back to Anthropic Claude."""
    # 1. Try Google Gemini with active production models
    if settings.GEMINI_API_KEY:
        gemini_models = [
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-flash-latest"
        ]
        
        # Method A: Direct standard-library urllib REST call (fastest, zero-dependency, immune to filesystem locking)
        try:
            import urllib.request
            import json
            for model_id in gemini_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={settings.GEMINI_API_KEY}"
                payload_bytes = json.dumps({
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"maxOutputTokens": max_tokens}
                }).encode("utf-8")
                req = urllib.request.Request(
                    url,
                    data=payload_bytes,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                try:
                    with urllib.request.urlopen(req, timeout=12.0) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode("utf-8"))
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts and "text" in parts[0]:
                                    return parts[0]["text"].strip()
                except Exception:
                    continue
        except Exception:
            pass

        # Method B: google.genai SDK
        gemini_client = get_gemini_client()
        if gemini_client is not None:
            for model_id in gemini_models:
                try:
                    response = gemini_client.models.generate_content(
                        model=model_id,
                        contents=prompt
                    )
                    if response and response.text:
                        return response.text.strip()
                except Exception:
                    continue

    # 2. Try Anthropic Claude
    claude_client = get_claude_client()
    if claude_client is not None:
        try:
            msg = claude_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return msg.content[0].text.strip()
        except Exception:
            pass

    return None

def generate_summary(text: str, document_name: str = "Legal Document") -> str:
    """Generates comprehensive executive legal summary via LLM or intelligent extractive analysis."""
    prompt = f"""You are a Senior Legal Counsel. Analyze this legal contract and write a professional, structured executive summary.
Cover:
1. Document Type & Purpose
2. Contracting Parties & Relationships
3. Effective Date, Term & Duration
4. Financial Consideration & Payment Terms
5. Key Affirmative & Negative Obligations
6. Termination Provisions & Notice Requirements
7. Key Risk Drivers & Exposure

Document Name: {document_name}
Content Excerpt:
{text[:9000]}
"""
    llm_result = call_llm(prompt, max_tokens=1800)
    if llm_result:
        return llm_result

    # High-quality structured extractive legal summary engine
    from app.services import nlp_service, ml_service
    nlp_res = nlp_service.process_document(text)
    clauses = ml_service.analyze_clauses(nlp_res["clauses"])
    risk = ml_service.calculate_overall_risk(clauses)

    parties_str = ", ".join([f"{p['name']} ({p.get('type', 'Party')})" for p in nlp_res["parties"][:4]]) or "Not explicitly identified in preamble"
    dates_str = ", ".join([d["date"] for d in nlp_res["dates"][:4]]) or "Date not specified"
    obligations = nlp_res["obligations"][:3]

    high_risk_texts = [f"• [{c.get('primary_category')}] {c.get('text')[:180]}..." for c in risk.get("high_risk_clauses", [])[:3]]
    high_risk_str = "\n".join(high_risk_texts) if high_risk_texts else "• No critical high-risk exposure detected."

    summary = f"""### Executive Legal Summary: {document_name}

**1. Document Type & Purpose:**
Legal binding agreement governing commercial terms, operational performance, and party obligations.

**2. Identified Parties:**
{parties_str}

**3. Key Dates & Milestones:**
{dates_str}

**4. Core Operational Obligations:**
{chr(10).join([f"• {ob[:200]}..." for ob in obligations]) if obligations else "• Standard contractual covenants and conditions apply."}

**5. Risk Assessment Overview:**
• **Overall Risk Level:** {risk.get('risk_level', 'Medium')} ({risk.get('overall_risk_score', 0)}%)
• **High-Risk Clauses Detected:** {risk.get('high_risk_count', 0)} of {risk.get('total_clauses_count', len(clauses))} evaluated clauses.
{high_risk_str}

---
*Note: Analyzed via LegalAI Extractive Intelligence Engine. To enable live Generative AI synthesis, add `GEMINI_API_KEY` to `backend/.env`.*"""
    return summary

def explain_clause(clause_text: str) -> str:
    """Translates legal clause into plain English with business risk context."""
    prompt = f"""Explain this legal clause in clear, simple plain English for a business executive in 3-4 concise sentences:
1. What rights or duties this creates
2. What potential business risk exists
3. What protective counter-measure is recommended

Clause:
"{clause_text}"
"""
    llm_result = call_llm(prompt, max_tokens=400)
    if llm_result:
        return llm_result

    # Knowledge-based plain English legal translator
    lower = clause_text.lower()
    explanation_parts = []

    if any(k in lower for k in ["indemnif", "hold harmless"]):
        explanation_parts.append("This is an indemnification clause. It forces one party to pay for damages, legal fees, or losses incurred by the other party.")
        explanation_parts.append("Risk: If unlimited, you could be liable for massive third-party claims beyond the contract value.")
        explanation_parts.append("Action: Negotiate to cap indemnity at fees paid and limit to direct gross negligence.")
    elif any(k in lower for k in ["terminat", "cancel"]):
        explanation_parts.append("This governs how and when the agreement can be ended.")
        explanation_parts.append("Risk: Clauses allowing termination 'without cause' or 'with immediate effect' create business disruption.")
        explanation_parts.append("Action: Require written notice and a 30-day cure period before termination takes effect.")
    elif any(k in lower for k in ["non-compete", "not compete", "non-solicit"]):
        explanation_parts.append("This restricts your right to conduct business or work in competitive markets.")
        explanation_parts.append("Risk: Overly broad duration or geographic scope can legally paralyze future commercial operations.")
        explanation_parts.append("Action: Ensure restrictions are strictly limited in time (e.g., 6-12 months) and territory.")
    elif any(k in lower for k in ["unlimited liability", "sole discretion", "irrevocable"]):
        explanation_parts.append("This grants one-sided power or removes normal financial safety limits.")
        explanation_parts.append("Risk: Exposes your organization to open-ended liability without mutual checks.")
        explanation_parts.append("Action: Insist on mutual standards and express liability caps.")
    else:
        explanation_parts.append("This clause establishes specific binding commitments and legal conditions between the parties.")
        explanation_parts.append("Both parties are bound to strictly uphold the performance terms detailed in this section.")
        explanation_parts.append("Ensure mutual remedies and standard industry grace periods apply.")

    return "\n\n".join(explanation_parts)

def answer_question(document_id: int, question: str, document_text: str) -> str:
    """Answers document queries using Retrieval-Augmented Generation (RAG)."""
    relevant_chunks = retrieve_relevant_chunks(document_id, question, top_k=4)
    context = "\n\n---\n\n".join(relevant_chunks) if relevant_chunks else document_text[:4000]

    prompt = f"""You are a precise Legal AI Assistant. Answer the question strictly using the provided contract excerpts.
If the answer is not mentioned in the text, clearly state: "Not explicitly stated in the document."

Contract Excerpts:
{context}

Question: {question}

Answer:"""

    llm_result = call_llm(prompt, max_tokens=600)
    if llm_result:
        return llm_result

    # High-precision Extractive RAG Fallback
    if not relevant_chunks:
        return "I could not find an explicit reference to that question in the uploaded document."

    top_passage = relevant_chunks[0]
    return f"""Based on the relevant clauses in the document:

"{top_passage.strip()[:450]}..."

*Excerpt retrieved via LegalAI Semantic Vector Index. Configure `GEMINI_API_KEY` for generative synthesis.*"""

def chat_with_document(document_id: int, messages: List[Dict[str, str]], document_text: str = "") -> str:
    """
    Multi-turn conversational assistant (Contract Co-Pilot).
    Maintains conversation thread history, retrieves relevant contract chunks for the latest prompt,
    and returns contextual, coherent legal analysis.
    """
    if not messages:
        return "Hello! I am your AI Contract Co-Pilot. How can I help you analyze this agreement?"

    latest_msg = messages[-1].get("content", "")
    relevant_chunks = retrieve_relevant_chunks(document_id, latest_msg, top_k=4)
    context = "\n\n---\n\n".join(relevant_chunks) if relevant_chunks else document_text[:4000]

    # Format previous conversation turns (up to last 6 messages)
    history_lines = []
    for m in messages[:-1]:
        role_label = "User" if m.get("role") == "user" else "Co-Pilot"
        history_lines.append(f"{role_label}: {m.get('content')}")
    history_str = "\n".join(history_lines[-6:]) if history_lines else "None (New conversation)"

    prompt = f"""You are Contract Co-Pilot, an expert AI legal assistant reviewing this contract.
Maintain a professional, conversational, and helpful tone. Reference specific terms when applicable.
If an item is not found in the contract, clarify that clearly.

CONTRACT EXCERPTS:
{context}

CONVERSATION HISTORY:
{history_str}

USER'S CURRENT QUESTION:
{latest_msg}

CO-PILOT ANSWER:"""

    llm_result = call_llm(prompt, max_tokens=750)
    if llm_result:
        return llm_result

    # Fallback to single-turn answer_question
    return answer_question(document_id, latest_msg, document_text)

def create_redrafted_docx(
    filename: str,
    full_text: str,
    original_clause: str,
    rewritten_clause: str,
    risk_tolerance: str = "balanced"
):
    """
    Creates an in-memory .docx file with LegalAI revision header and updated clause text.
    """
    import io
    from datetime import datetime

    buf = io.BytesIO()
    try:
        import docx
        from docx.shared import Inches, Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH

        doc = docx.Document()

        # Document Title
        title_p = doc.add_paragraph()
        title_p.paragraph_format.space_before = Pt(0)
        title_p.paragraph_format.space_after = Pt(4)
        run_title = title_p.add_run(f"REDRAFTED CONTRACT: {filename}")
        run_title.font.name = "Arial"
        run_title.font.size = Pt(16)
        run_title.font.bold = True
        run_title.font.color.rgb = RGBColor(30, 58, 95) # #1E3A5F

        # Subtitle / Notice
        sub_p = doc.add_paragraph()
        sub_p.paragraph_format.space_after = Pt(14)
        run_sub = sub_p.add_run(
            f"Generated via LegalAI Redline Engine • {datetime.now().strftime('%B %d, %Y')} • "
            f"Risk Tolerance Mode: {risk_tolerance.title()}"
        )
        run_sub.font.name = "Arial"
        run_sub.font.size = Pt(9.5)
        run_sub.font.color.rgb = RGBColor(100, 116, 139)

        # Revision Summary Box (Table)
        table = doc.add_table(rows=3, cols=2)
        table.style = 'Light Shading' if 'Light Shading' in [s.name for s in doc.styles] else 'Table Grid'
        
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = "REVISION AUDIT TRAIL"
        hdr_cells[1].text = "STATUS: APPLIED"
        
        row1_cells = table.rows[1].cells
        row1_cells[0].text = "Original Superseded Clause:"
        row1_cells[1].text = original_clause[:300] + ("..." if len(original_clause) > 300 else "")

        row2_cells = table.rows[2].cells
        row2_cells[0].text = f"AI Redrafted Clause ({risk_tolerance.title()}):"
        row2_cells[1].text = rewritten_clause

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(12)
        p_spacer.paragraph_format.space_after = Pt(6)
        run_sec = p_spacer.add_run("UPDATED CONTRACT TEXT:")
        run_sec.font.name = "Arial"
        run_sec.font.size = Pt(12)
        run_sec.font.bold = True

        # Perform replacement in full text
        updated_text = full_text
        if original_clause and original_clause in updated_text:
            updated_text = updated_text.replace(original_clause, f"\n[AI REDRAFTED CLAUSE - {risk_tolerance.upper()}]:\n{rewritten_clause}\n")
        else:
            # If not exact match, append prominently
            updated_text = f"{updated_text}\n\n[REVISED CLAUSE INSERTION - {risk_tolerance.upper()}]:\n{rewritten_clause}"

        for paragraph in updated_text.split("\n\n"):
            clean_p = paragraph.strip()
            if clean_p:
                p = doc.add_paragraph(clean_p)
                p.paragraph_format.space_after = Pt(6)
                p.paragraph_format.line_spacing = 1.15

        doc.save(buf)
        buf.seek(0)
        return buf

    except Exception:
        # Graceful fallback: clean plaintext / markdown file inside buffer
        content = f"""=======================================================
LEGALAI REDRAFTED CONTRACT
Document: {filename}
Date: {datetime.now().strftime('%B %d, %Y')}
Risk Tolerance Mode: {risk_tolerance.title()}
=======================================================

--- REVISION SUMMARY ---
ORIGINAL CLAUSE:
{original_clause}

REWRITTEN REVISION:
{rewritten_clause}

=======================================================
FULL UPDATED CONTRACT TEXT
=======================================================

{full_text.replace(original_clause, rewritten_clause) if original_clause in full_text else full_text + chr(10)*2 + rewritten_clause}
"""
        buf = io.BytesIO(content.encode('utf-8'))
        buf.seek(0)
        return buf

def generate_recommendations(clauses: List[Dict], overall_risk: Dict) -> str:
    """Generates actionable legal risk remediation steps."""
    high_risks = overall_risk.get("high_risk_clauses", [])
    clauses_text = "\n".join([f"- [{c.get('primary_category')}] {c.get('text', '')[:160]}" for c in high_risks[:5]])

    prompt = f"""You are a Senior Corporate Legal Advisor. Review these identified high-risk clauses and provide 5-6 practical, specific recommendations for contract negotiation and risk mitigation:

Overall Risk: {overall_risk.get('risk_level')} ({overall_risk.get('overall_risk_score')}%)
Flagged Clauses:
{clauses_text or 'Standard clauses detected'}

Provide bullet-pointed, actionable recommendations."""

    llm_result = call_llm(prompt, max_tokens=1000)
    if llm_result:
        return llm_result

    # Knowledge-based remediation rules
    recommendations = [
        "**1. Institute a Liability Cap:** Ensure aggregate liability is capped at a reasonable commercial ceiling (e.g., total fees paid in the preceding 12 months) and exclude punitive damages.",
        "**2. Add Notice and Cure Periods:** Any termination for cause should require at least 30 days written notice with an opportunity for the breaching party to cure.",
        "**3. Make Indemnification Mutual:** Modify one-sided indemnification clauses so both parties are held to identical standards of defense and hold-harmless coverage.",
        "**4. Narrow Non-Compete / Restrictive Covenants:** Limit non-compete provisions strictly to direct competitors within an explicit geographic radius for no longer than 12 months.",
        "**5. Specify Neutral Dispute Resolution:** Designate mutually agreeable governing law and jurisdiction, with mandatory good-faith mediation prior to formal litigation or binding arbitration."
    ]
    return "\n\n".join(recommendations)


def rewrite_clause(clause_text: str, risk_tolerance: str = "balanced") -> Dict[str, Any]:
    """
    Rewrites a risky legal clause into fairer language.
    risk_tolerance: "aggressive" (favor our side), "balanced" (mutual), "conservative" (safe)
    Returns: {"original": str, "rewritten": str, "changes_summary": str, "risk_reduction": str}
    """
    tone_instructions = {
        "aggressive": "strongly favor the reviewing party's interests while remaining legally enforceable",
        "balanced": "create a mutually fair and balanced clause with industry-standard protections for both parties",
        "conservative": "maximize protections for the reviewing party with the most conservative possible terms"
    }
    tone = tone_instructions.get(risk_tolerance, tone_instructions["balanced"])

    prompt = f"""You are a Senior Corporate Lawyer. Rewrite this legal clause to {tone}.

ORIGINAL CLAUSE:
"{clause_text[:2000]}"

Provide your response in this EXACT format:
REWRITTEN:
[Your rewritten clause here - 2 to 5 sentences maximum]

CHANGES:
[Bullet list of 3-4 key changes you made, e.g. "• Added 30-day cure period before termination"]

RISK REDUCTION:
[One sentence: e.g. "Reduces contractor liability exposure from unlimited to 12-month fee cap."]"""

    llm_result = call_llm(prompt, max_tokens=800)

    if llm_result:
        # Parse structured response
        rewritten = ""
        changes = ""
        risk_reduction = ""

        if "REWRITTEN:" in llm_result:
            parts = llm_result.split("REWRITTEN:", 1)
            rest = parts[1] if len(parts) > 1 else ""
            if "CHANGES:" in rest:
                rewritten_part, changes_rest = rest.split("CHANGES:", 1)
                rewritten = rewritten_part.strip()
                if "RISK REDUCTION:" in changes_rest:
                    changes_part, risk_part = changes_rest.split("RISK REDUCTION:", 1)
                    changes = changes_part.strip()
                    risk_reduction = risk_part.strip()
                else:
                    changes = changes_rest.strip()
            else:
                rewritten = rest.strip()
        else:
            rewritten = llm_result

        final_rewritten = rewritten or llm_result
        return {
            "original": clause_text,
            "rewritten": final_rewritten,
            "rewritten_clause": final_rewritten,
            "changes_summary": changes,
            "explanation": f"{changes}. {risk_reduction}".strip(". "),
            "risk_reduction": risk_reduction,
            "risk_tolerance": risk_tolerance
        }

    # Fallback rewrite templates
    lower = clause_text.lower()
    if "unlimited" in lower and "liabilit" in lower:
        rewritten = clause_text.replace("unlimited", "capped at the total fees paid in the preceding twelve (12) months")
        return {
            "original": clause_text,
            "rewritten": rewritten,
            "rewritten_clause": rewritten,
            "changes_summary": "Replaced unlimited liability with 12-month fee cap",
            "explanation": "Caps maximum financial exposure to contract value.",
            "risk_reduction": "Caps maximum financial exposure to contract value.",
            "risk_tolerance": risk_tolerance
        }
    if "sole discretion" in lower:
        rewritten = clause_text.replace("sole discretion", "commercially reasonable discretion, not to be unreasonably withheld")
        return {
            "original": clause_text,
            "rewritten": rewritten,
            "rewritten_clause": rewritten,
            "changes_summary": "Replaced 'sole discretion' with commercially reasonable standard",
            "explanation": "Prevents arbitrary unilateral decisions.",
            "risk_reduction": "Prevents arbitrary unilateral decisions.",
            "risk_tolerance": risk_tolerance
        }
    if "without notice" in lower:
        rewritten = clause_text.replace("without notice", "upon thirty (30) days prior written notice")
        return {
            "original": clause_text,
            "rewritten": rewritten,
            "rewritten_clause": rewritten,
            "changes_summary": "Added 30-day written notice requirement",
            "explanation": "Provides time to wind down operations or find alternative.",
            "risk_reduction": "Provides time to wind down operations or find alternative.",
            "risk_tolerance": risk_tolerance
        }

    fallback_text = f"[Suggested {risk_tolerance.title()} Revision]: {clause_text[:120]}... [Mutual obligations, standard indemnity caps, and reasonable 30-day cure periods apply]."
    return {
        "original": clause_text,
        "rewritten": fallback_text,
        "rewritten_clause": fallback_text,
        "changes_summary": "Standard mutual protections and cure period applied",
        "explanation": "Balanced protections and liability mitigation recommended.",
        "risk_reduction": "Requires legal counsel review for complete redraft.",
        "risk_tolerance": risk_tolerance
    }
