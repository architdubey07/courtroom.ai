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
    SimulatedVerdict,
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
    description="Backend API for moot court practice with AI Judge, AI Opposition Counsel, and Simulated Verdict",
    version="1.1.0"
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
    session_manager.set_turn(session.session_id, SpeakerRole.USER)

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
            detail="This hearing session has already concluded."
        )

    if not llm_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM API key is not configured on the server."
        )

    # Acquire session execution lock to prevent race conditions or duplicate submissions
    acquired = session_manager.acquire_session_lock(session.session_id)
    if not acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission is already being processed for this session. Please wait for the Court's response."
        )

    try:
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
        session_manager.set_turn(session.session_id, SpeakerRole.OPPOSITION)
        opp_prompt = PromptService.get_opposition_counsel_prompt(
            topic=session.topic,
            user_side=session.user_side,
            difficulty=session.difficulty,
            transcript_history=session.messages,
            latest_user_argument=req.argument.strip()
        )

        opp_rebuttal = await llm_service.generate_response(opp_prompt)

        session_manager.add_message(
            session_id=session.session_id,
            speaker=SpeakerRole.OPPOSITION,
            speaker_title=f"Opposing Counsel ({opp_side_label})",
            content=opp_rebuttal.strip(),
            round_number=current_round
        )

        # 3. Generate Judge Interlocutory Question / Directive
        session_manager.set_turn(session.session_id, SpeakerRole.JUDGE)
        judge_prompt = PromptService.get_judge_interlocutory_prompt(
            topic=session.topic,
            user_side=session.user_side,
            difficulty=session.difficulty,
            transcript_history=session.messages,
            latest_user_argument=req.argument.strip(),
            latest_opp_rebuttal=opp_rebuttal.strip(),
            round_number=current_round
        )

        judge_intervention = await llm_service.generate_response(judge_prompt)

        session_manager.add_message(
            session_id=session.session_id,
            speaker=SpeakerRole.JUDGE,
            speaker_title="Presiding Judge",
            content=judge_intervention.strip(),
            round_number=current_round
        )

        # Advance to next round and return turn to user
        session_manager.increment_round(session.session_id)
        session_manager.set_turn(session.session_id, SpeakerRole.USER)

        return HearingStatusResponse(
            session=session,
            status="active",
            message=f"Round {current_round} arguments submitted and recorded."
        )
    finally:
        session_manager.release_session_lock(session.session_id)

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
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hearing session '{session_id}' not found."
        )

    # If already concluded and verdict rendered, return directly
    if not session.is_active and session.verdict:
        return HearingStatusResponse(
            session=session,
            status="concluded",
            message="Hearing already concluded."
        )

    if not llm_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM API key is not configured on the server to generate final verdict."
        )

    acquired = session_manager.acquire_session_lock(session.session_id)
    if not acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A request is already being processed for this hearing session."
        )

    try:
        # Generate Structured Reasoned Verdict from full transcript
        verdict_prompt = PromptService.get_verdict_prompt(
            topic=session.topic,
            user_side=session.user_side,
            difficulty=session.difficulty,
            transcript_history=session.messages
        )

        verdict_data = await llm_service.generate_json_response(verdict_prompt)

        # Ensure correct side values and defaults if omitted
        opp_side_val = Side.RESPONDENT if session.user_side == Side.PETITIONER else Side.PETITIONER
        verdict = SimulatedVerdict(
            topic_summary=verdict_data.get("topic_summary", session.topic),
            user_side=session.user_side,
            opposition_side=opp_side_val,
            user_main_arguments=verdict_data.get("user_main_arguments", []),
            opposition_main_arguments=verdict_data.get("opposition_main_arguments", []),
            user_strongest_point=verdict_data.get("user_strongest_point", "Submissions on constitutional and doctrinal grounds."),
            opposition_strongest_point=verdict_data.get("opposition_strongest_point", "Counter-arguments on procedural and evidentiary standards."),
            user_weaknesses_and_gaps=verdict_data.get("user_weaknesses_and_gaps", []),
            opposition_weaknesses_and_gaps=verdict_data.get("opposition_weaknesses_and_gaps", []),
            rebuttal_analysis=verdict_data.get("rebuttal_analysis", "The parties engaged in active oral argument."),
            simulated_outcome=verdict_data.get("simulated_outcome", "Inconclusive / Remanded for Further Record"),
            judicial_reasoning=verdict_data.get("judicial_reasoning", "The Court evaluated the oral arguments and factual record presented."),
            advocacy_feedback_for_user=verdict_data.get("advocacy_feedback_for_user", [
                "Focus on directly addressing judicial questions before continuing with prepared arguments.",
                "Substantiate legal causation with concrete statutory or logical analogies."
            ]),
            disclaimer="SIMULATED EDUCATIONAL VERDICT — NOT A REAL COURT JUDGMENT OR LEGAL ADVICE."
        )

        # Set verdict and end session
        session_manager.set_verdict(session.session_id, verdict)

        # Add formal adjournment entry in transcript
        session_manager.add_message(
            session_id=session.session_id,
            speaker=SpeakerRole.JUDGE,
            speaker_title="Presiding Judge",
            content=(
                f"The hearing stands concluded and the Court has rendered its simulated verdict: "
                f"[{verdict.simulated_outcome}]. Counsel may review the Bench's reasoned assessment."
            ),
            round_number=session.current_round
        )

        return HearingStatusResponse(
            session=session,
            status="concluded",
            message="Hearing adjourned and simulated verdict generated."
        )
    finally:
        session_manager.release_session_lock(session.session_id)
