import type { Difficulty, Side, HearingResponse, SystemHealth } from './types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Fallback to text if not json
      const text = await res.text().catch(() => '');
      if (text) errorMsg = text;
    }
    throw new ApiError(errorMsg, res.status);
  }
  return res.json();
}

export async function fetchHealth(): Promise<SystemHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await handleResponse<SystemHealth>(res);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Unable to connect to backend courtroom server. Ensure backend is running.', 0);
  }
}

export async function startHearing(
  topic: string,
  user_side: Side,
  difficulty: Difficulty
): Promise<HearingResponse> {
  const res = await fetch(`${API_BASE}/hearing/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, user_side, difficulty }),
  });
  return handleResponse<HearingResponse>(res);
}

export async function submitArgument(
  session_id: string,
  argument: string
): Promise<HearingResponse> {
  const res = await fetch(`${API_BASE}/hearing/argument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, argument }),
  });
  return handleResponse<HearingResponse>(res);
}

export async function endHearing(session_id: string): Promise<HearingResponse> {
  const res = await fetch(`${API_BASE}/hearing/${session_id}/end`, {
    method: 'POST',
  });
  return handleResponse<HearingResponse>(res);
}

export async function getHearing(session_id: string): Promise<HearingResponse> {
  const res = await fetch(`${API_BASE}/hearing/${session_id}`);
  return handleResponse<HearingResponse>(res);
}
