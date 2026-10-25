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

export interface SimulatedVerdict {
  topic_summary: string;
  user_side: Side;
  opposition_side: Side;
  user_main_arguments: string[];
  opposition_main_arguments: string[];
  user_strongest_point: string;
  opposition_strongest_point: string;
  user_weaknesses_and_gaps: string[];
  opposition_weaknesses_and_gaps: string[];
  rebuttal_analysis: string;
  simulated_outcome: string;
  judicial_reasoning: string;
  advocacy_feedback_for_user: string[];
  disclaimer: string;
}

export interface HearingSession {
  session_id: string;
  topic: string;
  user_side: Side;
  opposition_side: Side;
  difficulty: Difficulty;
  current_round: number;
  is_active: boolean;
  is_processing?: boolean;
  current_turn?: SpeakerRole;
  messages: HearingMessage[];
  verdict?: SimulatedVerdict | null;
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
