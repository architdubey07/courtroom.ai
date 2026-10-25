# AI Courtroom Simulator

An immersive, professional web application designed for law students to practise moot court oral arguments against an AI Opposing Counsel under the management of an impartial AI Presiding Judge.

---

## 🏛️ System Features (Chunk 1 Foundation)

- **One Human User**: Advocate presenting submissions as either **Petitioner** or **Respondent**.
- **One AI Presiding Judge**:
  - Impartial, professional bench decorum.
  - Formally opens the hearing and invites opening submissions.
  - Intervenes between rounds to interrogate reasoning, probe weak links, and direct the flow of oral arguments.
  - Adjourns the proceedings upon hearing conclusion.
- **One AI Opposition Counsel**:
  - Always argues the side opposite to the human student.
  - Directly counters student submissions, identifying unfounded assumptions and logical gaps.
  - Adapts argumentative depth and pressure based on difficulty level.
- **Difficulty Rigor**:
  - **Easy**: Foundational reasoning, single manageable challenge per round.
  - **Medium**: Scrutiny of factual causation, statutory interpretation, and evidentiary support.
  - **Hard**: Piercing hypotheticals, testing extreme bounds, and challenging internal inconsistencies.
- **Aesthetic**: Dark navy, charcoal, restrained gold accents (`#d4af37`), glassmorphic panels, and clear legal typography.
- **Hypothetical Case Notice**: Clearly treats all propositions as hypothetical academic exercises.
- **Secure Backend LLM Architecture**:
  - All API keys reside exclusively on the backend (`backend/.env`).
  - Supports Google Gemini (`gemini-2.5-flash`) or OpenAI / OpenAI-compatible providers (`gpt-4o-mini`).
  - Explicit configuration error handling if API keys are unconfigured.

---

## 📁 Project Architecture

```
ai_livecourtroom/
├── backend/
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Local environment secrets (not exposed)
│   ├── requirements.txt        # Python backend dependencies
│   ├── pytest.ini              # Pytest configuration
│   ├── config.py               # Settings and LLM provider detection
│   ├── main.py                 # FastAPI application and courtroom endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic schemas (Session, Message, Difficulty, etc.)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── session_manager.py  # In-memory moot hearing session management
│   │   ├── prompt_service.py   # Specialized prompts for Judge and Opposition
│   │   └── llm_service.py      # LLM provider wrapper (Gemini / OpenAI / custom)
│   └── tests/
│       └── test_courtroom.py   # Pytest test suite
│
└── frontend/
    ├── index.html              # HTML entry with legal crest favicon
    ├── vite.config.ts          # Vite configuration with `/api` reverse proxy
    ├── package.json            # Frontend dependencies
    └── src/
        ├── types.ts            # TypeScript interfaces
        ├── api.ts              # API client and error handling
        ├── index.css           # Courtroom theme styling
        ├── App.tsx             # Main application orchestrator
        └── components/
            ├── Navbar.tsx          # Court header, brand crest, engine status
            ├── SetupScreen.tsx     # Moot case proposition setup, side & difficulty selector
            └── CourtroomScreen.tsx # 3-panel courtroom interface (Judge, Opposition, Floor)
```

---

## ⚙️ Prerequisites & Setup

### 1. Environment Variables Configuration

In `backend/.env`, configure your preferred LLM provider:

```bash
# Option A: Google Gemini (Recommended)
GEMINI_API_KEY=your_gemini_api_key_here

# Option B: OpenAI or OpenAI-Compatible endpoint (Groq / OpenRouter / Ollama)
OPENAI_API_KEY=your_openai_api_key_here
# Optional custom base URL:
# OPENAI_BASE_URL=https://api.groq.com/openai/v1

# Optional model override (defaults to gemini-2.5-flash or gpt-4o-mini)
# LLM_MODEL=gemini-2.5-flash
```

---

## 🚀 Running the Application

### 1. Run the Backend (FastAPI)

```powershell
cd backend
# Activate virtual environment if not already active:
.\venv\Scripts\activate
# Start FastAPI development server:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
API Swagger Documentation: `http://localhost:8000/docs`

### 2. Run the Frontend (Vite + React)

In a separate terminal:
```powershell
cd frontend
npm run dev
```
Frontend interface will be accessible at: `http://localhost:5173`

---

## 🧪 Running Tests

### Backend Test Suite
```powershell
cd backend
.\venv\Scripts\python -m pytest
```

### Frontend TypeScript Check & Build
```powershell
cd frontend
npm run build
```
