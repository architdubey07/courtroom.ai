from enum import Enum
from typing import List, Optional
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

class SimulatedVerdict(BaseModel):
    topic_summary: str = Field(..., description="Concise summary of the controversy")
    user_side: Side = Field(..., description="Side argued by the student")
    opposition_side: Side = Field(..., description="Side argued by AI opposition")
    user_main_arguments: List[str] = Field(default_factory=list, description="Core arguments raised by student")
    opposition_main_arguments: List[str] = Field(default_factory=list, description="Core arguments raised by opposition")
    user_strongest_point: str = Field(..., description="Most persuasive argument from student")
    opposition_strongest_point: str = Field(..., description="Most persuasive counterargument from opposition")
    user_weaknesses_and_gaps: List[str] = Field(default_factory=list, description="Weaknesses or unsupported assumptions in student argument")
    opposition_weaknesses_and_gaps: List[str] = Field(default_factory=list, description="Weaknesses in opposition argument")
    rebuttal_analysis: str = Field(..., description="Assessment of how well points were rebutted")
    simulated_outcome: str = Field(..., description="Simulated finding or inconclusive holding")
    judicial_reasoning: str = Field(..., description="Reasoned analysis supporting the simulated finding")
    advocacy_feedback_for_user: List[str] = Field(default_factory=list, description="Actionable points to improve oral advocacy")
    disclaimer: str = Field(
        default="SIMULATED EDUCATIONAL VERDICT — NOT A REAL COURT JUDGMENT OR LEGAL ADVICE.",
        description="Mandatory educational disclaimer"
    )

class HearingSession(BaseModel):
    session_id: str
    topic: str
    user_side: Side
    opposition_side: Side
    difficulty: Difficulty
    current_round: int
    is_active: bool
    is_processing: bool = False
    current_turn: SpeakerRole = SpeakerRole.USER
    messages: List[HearingMessage] = []
    verdict: Optional[SimulatedVerdict] = None
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
