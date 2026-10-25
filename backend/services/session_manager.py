import uuid
from datetime import datetime, timezone
from typing import Dict, Optional
from models.schemas import HearingSession, HearingMessage, Side, Difficulty, SpeakerRole

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, HearingSession] = {}

    def create_session(self, topic: str, user_side: Side, difficulty: Difficulty) -> HearingSession:
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
            messages=[],
            created_at=now_str
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[HearingSession]:
        return self._sessions.get(session_id)

    def add_message(
        self,
        session_id: str,
        speaker: SpeakerRole,
        speaker_title: str,
        content: str,
        round_number: Optional[int] = None
    ) -> HearingMessage:
        session = self.get_session(session_id)
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
        session = self.get_session(session_id)
        if session:
            session.current_round += 1
            return session.current_round
        return 1

    def end_hearing(self, session_id: str) -> Optional[HearingSession]:
        session = self.get_session(session_id)
        if session:
            session.is_active = False
            return session
        return None

session_manager = SessionManager()
