# AI Courtroom Simulator

An immersive, professional web application designed for law students to practise moot court oral arguments against an AI Opposing Counsel under the management of an impartial AI Presiding Judge, culminating in a structured, reasoned judicial verdict.

---

## 🏛️ Completed Features (Chunks 1 & 2)

- **One Human User**: Advocate presenting oral submissions as either **Petitioner** or **Respondent**.
- **One AI Presiding Judge**:
  - Impartial, professional bench decorum.
  - Convenes the moot court session and invites opening submissions.
  - Probes logical weaknesses, evidentiary gaps, and legal standards between rounds.
  - Formally renders the simulated verdict and adjourns proceedings.
- **One AI Opposition Counsel**:
  - Automatically paired to the opposing party (Petitioner vs. Respondent).
  - Directly counters student arguments with targeted rebuttals and challenging hypotheticals.
  - Adapts argumentative pressure to the selected difficulty tier without repetitive responses.
- **Difficulty Rigor**:
  - **Easy**: Accessible counterarguments, single manageable issue at a time.
  - **Medium**: Scrutiny of legal standards, factual causation, and evidentiary support.
  - **Hard (Elite Moot)**: Piercing hypotheticals, testing extreme bounds, and challenging internal inconsistencies.
- **Structured Final Simulated Verdict**:
  - Automatically generated when the user concludes the hearing.
  - Summary of the case controversy.
  - Comparative breakdown of main arguments from both sides.
  - Strongest points and vulnerabilities/evidentiary gaps identified for each side.
  - Rebuttal analysis and substantive judicial reasoning based strictly on arguments presented.
  - Actionable pedagogical advocacy tips for future moots.
  - Mandatory disclaimer: **SIMULATED EDUCATIONAL VERDICT — NOT A REAL COURT JUDGMENT OR LEGAL ADVICE.**
- **Session & Concurrency Safety**:
  - Full transcript context retained across rounds.
  - Thread-safe session locks preventing accidental double/concurrent submissions (409 Conflict protection).
  - Explicit turn banners indicating whose turn it is on the court floor.
  - Clean UI error handling and confirmation modals.
- **Secure Backend LLM Architecture**:
  - API keys reside exclusively on the backend (`backend/.env`).
  - Supports Google Gemini (`gemini-2.5-flash`) via `google-genai` and OpenAI/OpenAI-compatible models via `openai`.
  - Graceful configuration errors if keys are missing (never leaks secrets or crashes).

---

## 📁 Project Architecture

```
ai_livecourtroom/
├── backend/
│   ├── .env.example            # Environment variables template
│   ├── .env                    # Local environment secrets
│   ├── requirements.txt        # Python backend dependencies
│   ├── pytest.ini              # Pytest configuration
│   ├── config.py               # Settings and LLM provider detection
│   ├── main.py                 # FastAPI application, hearing endpoints & verdict API
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic schemas (Verdict, Session, Message, Difficulty, etc.)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── session_manager.py  # Thread-safe moot hearing session manager
│   │   ├── prompt_service.py   # Specialized prompts for Judge, Opposition & Verdict
│   │   └── llm_service.py      # LLM provider wrapper (Gemini / OpenAI / JSON parsing)
│   └── tests/
│       └── test_courtroom.py   # Backend test suite (9 passing tests)
│
└── frontend/
    ├── index.html              # HTML entry with legal crest favicon
    ├── vite.config.ts          # Vite configuration with `/api` reverse proxy
    ├── package.json            # Frontend dependencies
    └── src/
        ├── types.ts            # TypeScript interfaces (Verdict, Session, Message, etc.)
        ├── api.ts              # API client and error handling
        ├── index.css           # Courtroom theme styling (navy, charcoal, gold)
        ├── App.tsx             # Main application orchestrator
        └── components/
            ├── Navbar.tsx          # Court header, brand crest, engine status
            ├── SetupScreen.tsx     # Moot case proposition setup, side & difficulty selector
            ├── CourtroomScreen.tsx # 3-panel courtroom interface (Judge, Floor, Opposition)
            └── VerdictView.tsx     # Structured educational verdict and pedagogical feedback
```

---

## ⚙️ Configuration & Environment Variables

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
.\venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/docs`

### 2. Run the Frontend (Vite + React)

In a separate terminal:
```powershell
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:5173`

---

## 🧪 Verification & Tests

### Backend Tests (9 tests covering workflow, validation, and verdict):
```powershell
cd backend
.\venv\Scripts\python -m pytest
```

### Frontend TypeScript Check & Build:
```powershell
cd frontend
npm run build
```
