from typing import List, Dict
from models.schemas import Difficulty, Side, HearingMessage

class PromptService:
    @staticmethod
    def get_difficulty_guidance(difficulty: Difficulty) -> str:
        if difficulty == Difficulty.EASY:
            return (
                "DIFFICULTY LEVEL: EASY\n"
                "- Present basic, accessible counterarguments and foundational legal reasoning.\n"
                "- Focus on one manageable challenge or question at a time.\n"
                "- Use clear and direct phrasing without convoluted procedural traps.\n"
                "- Keep the critique grounded and constructive."
            )
        elif difficulty == Difficulty.MEDIUM:
            return (
                "DIFFICULTY LEVEL: MEDIUM\n"
                "- Present robust, disciplined counterarguments.\n"
                "- Scrutinize weaknesses in legal standards, factual causation, or lack of supporting evidence.\n"
                "- Offer nuanced rebuttals and point out gaps in the opponent's logical chain.\n"
                "- Challenge the opponent to substantiate their core claims."
            )
        else: # HARD
            return (
                "DIFFICULTY LEVEL: HARD (ELITE MOOT COURT STANDARD)\n"
                "- Present highly sophisticated, piercing legal counterarguments and rigorous analytical scrutiny.\n"
                "- Introduce testing hypotheticals that expose slippery slopes, unintended precedents, or internal contradictions.\n"
                "- Aggressively challenge unsupported assumptions, jurisdictional bounds, or evidentiary absences.\n"
                "- Dissect doctrine precisely and demand rigorous reconciliation with adverse hypothetical scenarios."
            )

    @classmethod
    def get_judge_opening_prompt(cls, topic: str, user_side: Side, difficulty: Difficulty) -> str:
        user_role_str = "Petitioner" if user_side == Side.PETITIONER else "Respondent"
        opp_role_str = "Respondent" if user_side == Side.PETITIONER else "Petitioner"
        diff_guide = cls.get_difficulty_guidance(difficulty)

        return f"""You are the Presiding Judge in a formal moot court hearing simulator for law students.

HEARING CONTEXT:
- Case Proposition / Topic: {topic}
- Petitioner / Respondent: The human advocate is appearing for the {user_role_str}. The opposing advocate is appearing for the {opp_role_str}.
- This is a simulated legal exercise based strictly on the hypothetical scenario outlined.
- Never claim or suggest that this simulation is an authentic or binding real-world judicial ruling.
- Do not fabricate real case citations or historical facts as authentic; treat all facts as hypothetical moot court propositions.

{diff_guide}

YOUR OBJECTIVE AS PRESIDING JUDGE:
1. Formally convene the moot court session with dignified, professional courtroom decorum.
2. Succinctly state the central legal question or tension raised by the proposition.
3. Invite the {user_role_str} (the human user) to present their opening submission on the first issue.
4. Keep your opening concise (under 130 words), authoritative, impartial, and focused. Do not lecture; open the floor cleanly.
"""

    @classmethod
    def get_opposition_counsel_prompt(
        cls,
        topic: str,
        user_side: Side,
        difficulty: Difficulty,
        transcript_history: List[HearingMessage],
        latest_user_argument: str,
    ) -> str:
        user_role_str = "Petitioner" if user_side == Side.PETITIONER else "Respondent"
        opp_role_str = "Respondent" if user_side == Side.PETITIONER else "Petitioner"
        diff_guide = cls.get_difficulty_guidance(difficulty)

        # Format transcript excerpt
        transcript_text = "\n".join(
            f"[{msg.speaker_title}]: {msg.content}" for msg in transcript_history[-6:]
        )

        return f"""You are the Opposing Counsel ({opp_role_str}) in a moot court hearing simulator.
The human user is appearing as the {user_role_str}.

CASE PROPOSITION / TOPIC:
{topic}

{diff_guide}

CORE RULES FOR OPPOSITION COUNSEL:
1. ADVOCACY: You MUST vigorously defend the {opp_role_str}'s position. You are completely adversarial to the {user_role_str}.
2. DIRECT REBUTTAL: You must directly tackle and dismantle the latest argument submitted by {user_role_str}.
3. NO COMPLACENCY: Never simply concede or agree with the user to make the moot easier. Identify the flaws, unfounded assumptions, and potential adverse consequences of their position.
4. HYPOTHETICAL INTEGRITY: Treat all facts as a hypothetical scenario. Do not claim real historical judicial precedent as authentic.
5. DECORUM: Address the court with standard moot court decorum ("May it please the Court", "Counsel submits", "With respect to my learned friend's contention...").
6. LENGTH & FOCUS: Provide a sharp, punchy, well-structured legal submission (approx. 140-220 words). Conclude with a strong, definitive challenge or question back to the {user_role_str}'s thesis.

RECENT TRANSCRIPT:
{transcript_text}

LATEST ARGUMENT FROM {user_role_str.upper()}:
"{latest_user_argument}"

Deliver your rebuttal as Opposing Counsel for the {opp_role_str} now.
"""

    @classmethod
    def get_judge_interlocutory_prompt(
        cls,
        topic: str,
        user_side: Side,
        difficulty: Difficulty,
        transcript_history: List[HearingMessage],
        latest_user_argument: str,
        latest_opp_rebuttal: str,
        round_number: int,
    ) -> str:
        user_role_str = "Petitioner" if user_side == Side.PETITIONER else "Respondent"
        opp_role_str = "Respondent" if user_side == Side.PETITIONER else "Petitioner"
        diff_guide = cls.get_difficulty_guidance(difficulty)

        return f"""You are the Presiding Judge managing a formal moot court hearing simulator.

CASE PROPOSITION / TOPIC:
{topic}
HUMAN COUNSEL: {user_role_str}
OPPOSING COUNSEL: {opp_role_str}
ROUND: {round_number}

{diff_guide}

JUDICIAL RESPONSIBILITIES:
1. Remain strictly neutral, dignified, and judicial. Do not champion either side.
2. In this round, you have just heard:
   - {user_role_str}'s submission: "{latest_user_argument}"
   - {opp_role_str}'s rebuttal: "{latest_opp_rebuttal}"
3. Analyze the clash of arguments. Identify a specific weak link, tension, or evidentiary/doctrinal hurdle in {user_role_str}'s position (or the clash between both parties).
4. Pose a targeted, probing judicial question or directive specifically to {user_role_str} to test their legal reasoning.
5. Remind counsel whose turn it is: call upon {user_role_str} to answer the Bench's question and proceed with their submission.
6. Keep your intervention concise and impactful (80-140 words). Never make a final determination of the case yet. Treat the proposition as purely hypothetical.
"""
