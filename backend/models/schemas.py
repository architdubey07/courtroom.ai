from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Side(str, Enum):
    PETITIONER = "petitioner"
    RESPONDENT = "respondent"

class SpeakerRole(str, Enum):
    JUDGE = "judge"
    OPPOSITION = "opposition"
    USER = "user"

class HearingMessage(BaseModel):
    id: str
    speaker: SpeakerRole
    speaker_title: str
    content: str
    round_number: int
    timestamp: str

class StartHearingRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=5000, description="Legal proposition or topic")
    user_side: Side = Field(..., description="Petitioner or Respondent")
    difficulty: Difficulty = Field(default=Difficulty.MEDIUM, description="Difficulty level")

class SubmitArgumentRequest(BaseModel):
    session_id: str = Field(..., description="ID of the active hearing session")
    argument: str = Field(..., min_length=5, max_length=10000, description="Advocate's submission")

class HearingSession(BaseModel):
    session_id: str
    topic: str
    user_side: Side
    opposition_side: Side
    difficulty: Difficulty
    current_round: int
    is_active: bool
    messages: List[HearingMessage] = []
    created_at: str

class HearingStatusResponse(BaseModel):
    session: HearingSession
    status: str
    message: Optional[str] = None

class SystemHealthResponse(BaseModel):
    status: str
    llm_configured: bool
    provider: Optional[str] = None
    default_model: Optional[str] = None
