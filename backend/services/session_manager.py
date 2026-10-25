import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, Optional, List
from models.schemas import HearingSession, HearingMessage, Side, Difficulty, SpeakerRole, SimulatedVerdict

class SessionManager:
    """
    In-Memory Session Storage for AI Courtroom Simulator.

    Architectural characteristics & limitations:
    - Maintains active hearing sessions in process memory for low latency.
    - Thread-safe locks prevent concurrent or duplicate submissions for the same session.
    - Volatile: sessions reset on server restart (appropriate for MVP moot court practice sessions).
    - Future extension: Can be backed by Redis or PostgreSQL without altering public API contracts.
    """
    def __init__(self):
        self._sessions: Dict[str, HearingSession] = {}
        self._lock = threading.Lock()

    def create_session(self, topic: str, user_side: Side, difficulty: Difficulty) -> HearingSession:
        with self._lock:
            session_id = str(uuid.uuid4())
            opp_side = Side.RESPONDENT if user_side == Side.PETITIONER else Side.PETITIONER
            now_str = datetime.now(timezone.utc).isoformat()

            session = HearingSession(
                session_id=session_id,
                topic=topic,
                user_side=user_side,
                opposition_side=opp_side,
                difficulty=difficulty,
                current_round=1,
                is_active=True,
                is_processing=False,
                current_turn=SpeakerRole.USER,
                messages=[],
                verdict=None,
                created_at=now_str
            )
            self._sessions[session_id] = session
            return session

    def get_session(self, session_id: str) -> Optional[HearingSession]:
        with self._lock:
            return self._sessions.get(session_id)

    def acquire_session_lock(self, session_id: str) -> bool:
        """
        Attempts to acquire execution lock for a session.
        Returns False if the session is already processing an argument or verdict.
        Prevents race conditions and duplicate submissions.
        """
        with self._lock:
            session = self._sessions.get(session_id)
            if not session or session.is_processing:
                return False
            session.is_processing = True
            return True

    def release_session_lock(self, session_id: str):
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.is_processing = False

    def set_turn(self, session_id: str, turn: SpeakerRole):
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.current_turn = turn

    def add_message(
        self,
        session_id: str,
        speaker: SpeakerRole,
        speaker_title: str,
        content: str,
        round_number: Optional[int] = None
    ) -> HearingMessage:
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                raise KeyError(f"Session {session_id} not found")

            msg_round = round_number if round_number is not None else session.current_round
            message = HearingMessage(
                id=str(uuid.uuid4()),
                speaker=speaker,
                speaker_title=speaker_title,
                content=content,
                round_number=msg_round,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            session.messages.append(message)
            return message

    def increment_round(self, session_id: str) -> int:
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.current_round += 1
                return session.current_round
            return 1

    def set_verdict(self, session_id: str, verdict: SimulatedVerdict) -> Optional[HearingSession]:
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.verdict = verdict
                session.is_active = False
                session.current_turn = SpeakerRole.JUDGE
                return session
            return None

    def end_hearing(self, session_id: str) -> Optional[HearingSession]:
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.is_active = False
                return session
            return None

    def get_full_transcript_text(self, session_id: str) -> str:
        """
        Formats the complete transcript history for LLM prompt context injection.
        Ensures the model retains the entire arc of arguments without losing earlier context.
        """
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return ""
            lines: List[str] = []
            for msg in session.messages:
                lines.append(f"[Round {msg.round_number} - {msg.speaker_title}]: {msg.content}")
            return "\n\n".join(lines)

session_manager = SessionManager()
