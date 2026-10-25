import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from models.schemas import (
    StartHearingRequest,
    SubmitArgumentRequest,
    HearingSession,
    HearingStatusResponse,
    SystemHealthResponse,
    SpeakerRole,
    Side,
)
from services.session_manager import session_manager
from services.prompt_service import PromptService
from services.llm_service import llm_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("courtroom.api")

app = FastAPI(
    title="AI Courtroom Simulator API",
    description="Backend API for moot court practice with AI Judge and AI Opposition Counsel",
    version="1.0.0"
)

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", response_model=SystemHealthResponse)
async def health_check():
    return SystemHealthResponse(
        status="healthy",
        llm_configured=llm_service.is_configured(),
        provider=settings.provider,
        default_model=settings.default_model if llm_service.is_configured() else None
    )

@app.post("/api/hearing/start", response_model=HearingStatusResponse)
async def start_hearing(req: StartHearingRequest):
    if not llm_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "LLM API key is not configured on the server. "
                "Please configure GEMINI_API_KEY or OPENAI_API_KEY in the backend/.env file."
            )
        )

    # Initialize hearing session
    session = session_manager.create_session(
        topic=req.topic.strip(),
        user_side=req.user_side,
        difficulty=req.difficulty
    )

    # Generate Judge Opening Remark
    judge_prompt = PromptService.get_judge_opening_prompt(
        topic=session.topic,
        user_side=session.user_side,
        difficulty=session.difficulty
    )

    try:
        judge_opening = await llm_service.generate_response(judge_prompt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating judge opening: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Judge opening submission."
        )

    # Record Judge Opening Message
    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.JUDGE,
        speaker_title="Presiding Judge",
        content=judge_opening.strip(),
        round_number=1
    )

    return HearingStatusResponse(
        session=session,
        status="active",
        message="Moot court hearing initiated. The Bench invites opening arguments."
    )

@app.post("/api/hearing/argument", response_model=HearingStatusResponse)
async def submit_argument(req: SubmitArgumentRequest):
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hearing session '{req.session_id}' not found."
        )

    if not session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This hearing session has concluded."
        )

    if not llm_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM API key is not configured on the server."
        )

    current_round = session.current_round
    user_side_label = "Petitioner" if session.user_side == Side.PETITIONER else "Respondent"
    opp_side_label = "Respondent" if session.user_side == Side.PETITIONER else "Petitioner"

    # 1. Record User Argument
    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.USER,
        speaker_title=f"{user_side_label} Counsel (You)",
        content=req.argument.strip(),
        round_number=current_round
    )

    # 2. Generate Opposition Counsel Rebuttal
    opp_prompt = PromptService.get_opposition_counsel_prompt(
        topic=session.topic,
        user_side=session.user_side,
        difficulty=session.difficulty,
        transcript_history=session.messages,
        latest_user_argument=req.argument.strip()
    )

    try:
        opp_rebuttal = await llm_service.generate_response(opp_prompt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating opposition rebuttal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Opposition Counsel rebuttal."
        )

    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.OPPOSITION,
        speaker_title=f"Opposing Counsel ({opp_side_label})",
        content=opp_rebuttal.strip(),
        round_number=current_round
    )

    # 3. Generate Judge Interlocutory Question / Directive
    judge_prompt = PromptService.get_judge_interlocutory_prompt(
        topic=session.topic,
        user_side=session.user_side,
        difficulty=session.difficulty,
        transcript_history=session.messages,
        latest_user_argument=req.argument.strip(),
        latest_opp_rebuttal=opp_rebuttal.strip(),
        round_number=current_round
    )

    try:
        judge_intervention = await llm_service.generate_response(judge_prompt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating judge interlocutory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Judge intervention."
        )

    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.JUDGE,
        speaker_title="Presiding Judge",
        content=judge_intervention.strip(),
        round_number=current_round
    )

    # Advance to next round
    session_manager.increment_round(session.session_id)

    return HearingStatusResponse(
        session=session,
        status="active",
        message=f"Round {current_round} arguments submitted and recorded."
    )

@app.get("/api/hearing/{session_id}", response_model=HearingStatusResponse)
async def get_hearing_status(session_id: str):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hearing session '{session_id}' not found."
        )
    return HearingStatusResponse(
        session=session,
        status="active" if session.is_active else "concluded",
        message=None
    )

@app.post("/api/hearing/{session_id}/end", response_model=HearingStatusResponse)
async def end_hearing(session_id: str):
    session = session_manager.end_hearing(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hearing session '{session_id}' not found."
        )

    # Add formal adjournment message by the Judge
    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.JUDGE,
        speaker_title="Presiding Judge",
        content="The hearing is now formally concluded and the Court stands adjourned. Thank you, counsel, for your submissions.",
        round_number=session.current_round
    )

    return HearingStatusResponse(
        session=session,
        status="concluded",
        message="Hearing adjourned."
    )
