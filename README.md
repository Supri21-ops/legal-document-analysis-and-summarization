<<<<<<< HEAD
# ⚖️ Intelligent Legal Document Analysis & Contract Summarization

A full-stack intelligent legal document analysis system combining **NLP**, **AI/ML**, **Generative AI**, **Blockchain**, and **Cloud Computing**.

## 🏗️ Architecture

```
Frontend (Angular) ──► Backend (FastAPI) ──► AI/NLP Engine
                              │                    │
                              │              ML Risk Engine
                              │                    │
                         PostgreSQL           GenAI (Claude)
                              │                    │
                         File Storage           RAG + FAISS
                              │
                        Blockchain (Ganache + Solidity)
```

## 📁 Project Structure

```
LA Assignment/
├── backend/                   # FastAPI Python backend
│   ├── app/
│   │   ├── main.py            # App entry point
│   │   ├── config.py          # Configuration & env variables
│   │   ├── database.py        # PostgreSQL connection
│   │   ├── models/            # SQLAlchemy models
│   │   ├── routers/           # API route handlers
│   │   ├── services/          # Business logic services
│   │   │   ├── nlp_service.py        # spaCy NLP processing
│   │   │   ├── ml_service.py         # Legal-BERT classification
│   │   │   ├── genai_service.py      # Claude AI + RAG
│   │   │   ├── blockchain_service.py # Web3 + Smart contract
│   │   │   └── document_service.py   # PDF/DOCX extraction
│   │   └── utils/             # Helper utilities
│   ├── contracts/             # Solidity smart contracts
│   ├── requirements.txt
│   └── .env.example
├── frontend/                  # Angular application
│   ├── src/app/
│   │   ├── components/        # UI components
│   │   ├── services/          # HTTP services
│   │   └── models/            # TypeScript interfaces
│   └── package.json
└── docker-compose.yml         # Full stack deployment
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17 + TailwindCSS |
| Backend | Python 3.11 + FastAPI |
| NLP | spaCy (en_core_web_lg) + Transformers |
| AI/ML | Legal-BERT (HuggingFace) + scikit-learn |
| Generative AI | Anthropic Claude API + RAG (FAISS + ChromaDB) |
| Blockchain | Solidity + Ganache + Web3.py |
| Database | PostgreSQL + SQLAlchemy |
| Storage | Local / AWS S3 |
| Auth | JWT (python-jose) |

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Ganache CLI (`npm install -g ganache`)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_lg

# Copy and edit env file
copy .env.example .env

# Run database migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
ng serve --port 4200
```

### Blockchain Setup

```bash
# Start Ganache local blockchain
ganache --port 8545 --deterministic

# Deploy smart contract
cd backend
python contracts/deploy.py
```

### Run All Services

```bash
docker-compose up -d
```

## 🔑 Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/legal_db
ANTHROPIC_API_KEY=your_claude_api_key
SECRET_KEY=your_jwt_secret_key
GANACHE_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=deployed_contract_address
UPLOAD_DIR=./uploads
```

## 📚 API Documentation

After starting the backend, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎓 Academic Context

This project demonstrates the integration of:
1. **NLP** — Named Entity Recognition, clause detection, legal term extraction
2. **AI/ML** — Legal-BERT based clause classification and risk scoring
3. **Generative AI** — RAG-based Q&A, summarization, clause explanation
4. **Blockchain** — SHA-256 document hashing + Ethereum smart contract verification
5. **Cloud Computing** — Containerized deployment on AWS/GCP/Azure
=======
# legal-document-analysis-and-summarization
>>>>>>> 5350e9b2cb2302287a3ad4f3b12f1b583f4d9aa0
