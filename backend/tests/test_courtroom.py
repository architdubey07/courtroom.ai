import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app
from models.schemas import Side, Difficulty, SpeakerRole
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

def test_session_manager():
    session = session_manager.create_session("Privacy Rights", Side.PETITIONER, Difficulty.MEDIUM)
    assert session.topic == "Privacy Rights"
    assert session.user_side == Side.PETITIONER
    assert session.opposition_side == Side.RESPONDENT
    assert session.current_round == 1
    assert session.is_active is True

    msg = session_manager.add_message(
        session_id=session.session_id,
        speaker=SpeakerRole.USER,
        speaker_title="Petitioner Counsel (You)",
        content="Opening submission text"
    )
    assert msg.speaker == SpeakerRole.USER
    assert len(session.messages) == 1

    session_manager.increment_round(session.session_id)
    assert session.current_round == 2

    ended = session_manager.end_hearing(session.session_id)
    assert ended.is_active is False

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

def test_mocked_hearing_flow():
    mock_llm_response = "May it please the Court, this is a simulated judicial response."
    with patch("services.llm_service.llm_service.is_configured", return_value=True), \
         patch("services.llm_service.llm_service.generate_response", new=AsyncMock(return_value=mock_llm_response)):
        
        # 1. Start hearing
        start_res = client.post(
            "/api/hearing/start",
            json={
                "topic": "Algorithmic Bias in Criminal Sentencing",
                "user_side": "petitioner",
                "difficulty": "hard"
            }
        )
        assert start_res.status_code == 200
        start_data = start_res.json()
        session_id = start_data["session"]["session_id"]
        assert len(start_data["session"]["messages"]) == 1
        assert start_data["session"]["messages"][0]["speaker"] == "judge"

        # 2. Submit argument
        arg_res = client.post(
            "/api/hearing/argument",
            json={
                "session_id": session_id,
                "argument": "The algorithm violates due process by relying on proprietary black-box scoring."
            }
        )
        assert arg_res.status_code == 200
        arg_data = arg_res.json()
        # Round 1 has User + Opposition + Judge => 4 total messages in transcript
        assert len(arg_data["session"]["messages"]) == 4
        assert arg_data["session"]["current_round"] == 2

        # 3. End hearing
        end_res = client.post(f"/api/hearing/{session_id}/end")
        assert end_res.status_code == 200
        assert end_res.json()["session"]["is_active"] is False
