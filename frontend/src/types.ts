export type Difficulty = 'easy' | 'medium' | 'hard';
export type Side = 'petitioner' | 'respondent';
export type SpeakerRole = 'judge' | 'opposition' | 'user';

export interface HearingMessage {
  id: string;
  speaker: SpeakerRole;
  speaker_title: string;
  content: string;
  round_number: number;
  timestamp: string;
}

export interface HearingSession {
  session_id: string;
  topic: string;
  user_side: Side;
  opposition_side: Side;
  difficulty: Difficulty;
  current_round: number;
  is_active: boolean;
  messages: HearingMessage[];
  created_at: string;
}

export interface HearingResponse {
  session: HearingSession;
  status: string;
  message?: string;
}

export interface SystemHealth {
  status: string;
  llm_configured: boolean;
  provider?: string | null;
  default_model?: string | null;
}
