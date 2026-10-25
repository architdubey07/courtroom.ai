import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app
from models.schemas import Side, Difficulty, SpeakerRole, SimulatedVerdict
from services.session_manager import session_manager
from services.prompt_service import PromptService

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "llm_configured" in data

def test_prompt_service_difficulty():
    for diff in [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]:
        guide = PromptService.get_difficulty_guidance(diff)
        assert diff.value.upper() in guide

        judge_prompt = PromptService.get_judge_opening_prompt("Test Proposition", Side.PETITIONER, diff)
        assert "Presiding Judge" in judge_prompt
        assert "Petitioner" in judge_prompt

        opp_prompt = PromptService.get_opposition_counsel_prompt(
            topic="Test Proposition",
            user_side=Side.PETITIONER,
            difficulty=diff,
            transcript_history=[],
            latest_user_argument="I submit that privacy is violated."
        )
        assert "Opposing Counsel" in opp_prompt
        assert "Respondent" in opp_prompt

def test_opposition_side_pairing():
    # When user is Petitioner, opposition must be Respondent
    s1 = session_manager.create_session("Topic 1", Side.PETITIONER, Difficulty.EASY)
    assert s1.user_side == Side.PETITIONER
    assert s1.opposition_side == Side.RESPONDENT

    # When user is Respondent, opposition must be Petitioner
    s2 = session_manager.create_session("Topic 2", Side.RESPONDENT, Difficulty.HARD)
    assert s2.user_side == Side.RESPONDENT
    assert s2.opposition_side == Side.PETITIONER

def test_session_manager_and_transcript_continuity():
    session = session_manager.create_session("Privacy Rights in Modern Tech", Side.PETITIONER, Difficulty.MEDIUM)
    assert session.current_round == 1
    assert session.is_active is True
    assert session.current_turn == SpeakerRole.USER

    # Add Round 1 messages
    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.JUDGE,
        speaker_title="Presiding Judge",
        content="Court is convened.",
        round_number=1
    )
    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.USER,
        speaker_title="Petitioner Counsel (You)",
        content="First round submission.",
        round_number=1
    )
    session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.OPPOSITION,
        speaker_title="Opposing Counsel (Respondent)",
        content="First round rebuttal.",
        round_number=1
    )

    session_manager.increment_round(session.session_id)
    assert session.current_round == 2

    # Check transcript continuity
    full_text = session_manager.get_full_transcript_text(session.session_id)
    assert "Round 1 - Presiding Judge" in full_text
    assert "Round 1 - Petitioner Counsel (You)" in full_text
    assert "Round 1 - Opposing Counsel (Respondent)" in full_text

def test_invalid_input_validation():
    # 1. Topic too short (< 5 chars)
    res_short_topic = client.post(
        "/api/hearing/start",
        json={"topic": "Law", "user_side": "petitioner", "difficulty": "easy"}
    )
    assert res_short_topic.status_code == 422

    # 2. Invalid difficulty value
    res_invalid_diff = client.post(
        "/api/hearing/start",
        json={"topic": "Valid proposition here", "user_side": "petitioner", "difficulty": "extreme"}
    )
    assert res_invalid_diff.status_code == 422

    # 3. Invalid side value
    res_invalid_side = client.post(
        "/api/hearing/start",
        json={"topic": "Valid proposition here", "user_side": "neutral_judge", "difficulty": "medium"}
    )
    assert res_invalid_side.status_code == 422

    # 4. Empty argument submission
    res_empty_arg = client.post(
        "/api/hearing/argument",
        json={"session_id": "nonexistent-id", "argument": "   "}
    )
    assert res_empty_arg.status_code in [404, 422]

def test_start_hearing_unconfigured_error():
    with patch("services.llm_service.llm_service.is_configured", return_value=False):
        response = client.post(
            "/api/hearing/start",
            json={
                "topic": "Freedom of Speech in University Campuses",
                "user_side": "petitioner",
                "difficulty": "medium"
            }
        )
        assert response.status_code == 503
        assert "LLM API key is not configured" in response.json()["detail"]

def test_llm_provider_failure_handling():
    with patch("services.llm_service.llm_service.is_configured", return_value=True), \
         patch("services.llm_service.llm_service.generate_response", side_effect=Exception("Connection timed out to upstream AI")):
        response = client.post(
            "/api/hearing/start",
            json={
                "topic": "Freedom of Speech in University Campuses",
                "user_side": "petitioner",
                "difficulty": "medium"
            }
        )
        assert response.status_code == 500
        assert "Failed to generate Judge opening" in response.json()["detail"]

def test_duplicate_submission_lock():
    session = session_manager.create_session("Lock Test Proposition", Side.PETITIONER, Difficulty.EASY)
    session_id = session.session_id

    # Acquire lock manually
    assert session_manager.acquire_session_lock(session_id) is True
    # Attempt second lock -> must fail
    assert session_manager.acquire_session_lock(session_id) is False

    # Try submitting while locked -> must return 409 Conflict
    with patch("services.llm_service.llm_service.is_configured", return_value=True):
        res = client.post(
            "/api/hearing/argument",
            json={"session_id": session_id, "argument": "This should be blocked as duplicate."}
        )
        assert res.status_code == 409
        assert "already being processed" in res.json()["detail"]

    # Release lock
    session_manager.release_session_lock(session_id)
    assert session_manager.acquire_session_lock(session_id) is True
    session_manager.release_session_lock(session_id)

def test_complete_hearing_and_verdict_workflow():
    mock_opening = "The Moot Court is in session. Petitioner, please deliver your opening submission."
    mock_opp_rebuttal = "Opposing counsel submits that Petitioner has failed to satisfy the threshold requirement."
    mock_judge_interlocutory = "Counsel, how do you address the jurisdictional hurdle raised by Respondent?"
    
    mock_verdict_json = {
        "topic_summary": "Dispute concerning autonomous vehicle sensor liability in bad weather.",
        "user_side": "petitioner",
        "opposition_side": "respondent",
        "user_main_arguments": [
            "Strict liability applies to automated vehicular decisions.",
            "Manufacturer retained control over algorithmic updates."
        ],
        "opposition_main_arguments": [
            "Inclement weather constituted an unforeseeable superseding cause.",
            "Backup human driver had constructive duty of care."
        ],
        "user_strongest_point": "Demonstrating that design defect doctrine extends to sensor blindspots.",
        "opposition_strongest_point": "Establishing that user agreement mandated human intervention.",
        "user_weaknesses_and_gaps": [
            "Failed to provide evidence of standard industry sensor tolerance levels."
        ],
        "opposition_weaknesses_and_gaps": [
            "Relied heavily on disclaimers rather than addressing system marketing."
        ],
        "rebuttal_analysis": "Petitioner was tested sharply on causation; Respondent maintained defensive posture.",
        "simulated_outcome": "Ruling in favor of Petitioner",
        "judicial_reasoning": "The Court finds the algorithmic design defect persuasive given the foreseeability of bad weather.",
        "advocacy_feedback_for_user": [
            "Anchor legal standards in primary statutory or constitutional definitions earlier.",
            "Address judge's jurisdictional query directly before moving back to main point."
        ],
        "disclaimer": "SIMULATED EDUCATIONAL VERDICT — NOT A REAL COURT JUDGMENT OR LEGAL ADVICE."
    }

    with patch("services.llm_service.llm_service.is_configured", return_value=True), \
         patch("services.llm_service.llm_service.generate_response", side_effect=[
             mock_opening,            # Judge opening
             mock_opp_rebuttal,       # Opposition rebuttal round 1
             mock_judge_interlocutory # Judge interlocutory round 1
         ]), \
         patch("services.llm_service.llm_service.generate_json_response", new=AsyncMock(return_value=mock_verdict_json)):
        
        # 1. Start hearing
        start_res = client.post(
            "/api/hearing/start",
            json={
                "topic": "Autonomous Vehicle Sensor Failure in Severe Weather",
                "user_side": "petitioner",
                "difficulty": "medium"
            }
        )
        assert start_res.status_code == 200
        start_data = start_res.json()
        session_id = start_data["session"]["session_id"]
        assert start_data["session"]["current_round"] == 1
        assert len(start_data["session"]["messages"]) == 1
        assert start_data["session"]["messages"][0]["speaker"] == "judge"

        # 2. Submit Round 1 Argument
        arg_res = client.post(
            "/api/hearing/argument",
            json={
                "session_id": session_id,
                "argument": "The autonomous driving software failed to accommodate predictable heavy rain conditions."
            }
        )
        assert arg_res.status_code == 200
        arg_data = arg_res.json()
        # Message count: Opening (1) + User (1) + Opposition (1) + Judge (1) = 4
        assert len(arg_data["session"]["messages"]) == 4
        assert arg_data["session"]["current_round"] == 2
        assert arg_data["session"]["current_turn"] == "user"

        # 3. Conclude hearing and generate final verdict
        end_res = client.post(f"/api/hearing/{session_id}/end")
        assert end_res.status_code == 200
        end_data = end_res.json()
        assert end_data["status"] == "concluded"
        assert end_data["session"]["is_active"] is False

        # Verify structured verdict content
        verdict = end_data["session"]["verdict"]
        assert verdict is not None
        assert verdict["simulated_outcome"] == "Ruling in favor of Petitioner"
        assert len(verdict["user_main_arguments"]) == 2
        assert len(verdict["advocacy_feedback_for_user"]) == 2
        assert "SIMULATED EDUCATIONAL VERDICT" in verdict["disclaimer"]
