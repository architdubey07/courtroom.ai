import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SetupScreen } from './components/SetupScreen';
import { CourtroomScreen } from './components/CourtroomScreen';
import type { Difficulty, Side, HearingSession, SystemHealth } from './types';
import { fetchHealth, startHearing, submitArgument, endHearing, ApiError } from './api';

export function App() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [session, setSession] = useState<HearingSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Poll or check system health on initial load
  useEffect(() => {
    let isMounted = true;
    const checkSystem = async () => {
      try {
        const h = await fetchHealth();
        if (isMounted) setHealth(h);
      } catch (err: any) {
        if (isMounted) {
          console.warn('Backend health check error:', err);
          setHealth({ status: 'offline', llm_configured: false });
        }
      }
    };

    checkSystem();
    const interval = setInterval(checkSystem, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStartHearing = async (topic: string, side: Side, difficulty: Difficulty) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await startHearing(topic, side, difficulty);
      setSession(response.session);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while convening the hearing.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitArgument = async (argument: string) => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await submitArgument(session.session_id, argument);
      setSession(response.session);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to record argument or receive courtroom response.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndHearing = async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await endHearing(session.session_id);
      setSession(response.session);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to adjourn hearing.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewHearing = () => {
    if (session && session.is_active) {
      if (!window.confirm('Do you wish to leave the active hearing and return to docket setup?')) {
        return;
      }
    }
    setSession(null);
    setError(null);
  };

  return (
    <div className="court-bg">
      <Navbar
        health={health}
        currentRound={session?.current_round}
        isInHearing={Boolean(session)}
        onNewHearing={handleNewHearing}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!session ? (
          <SetupScreen
            onStartHearing={handleStartHearing}
            isLoading={isLoading}
            error={error}
            health={health}
          />
        ) : (
          <CourtroomScreen
            session={session}
            onSubmitArgument={handleSubmitArgument}
            onEndHearing={handleEndHearing}
            isLoading={isLoading}
            error={error}
          />
        )}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '16px 24px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.775rem',
        color: 'var(--text-dim)',
      }}>
        AI Courtroom Simulator — Moot Court Training Platform | Powered by FastAPI & React
      </footer>
    </div>
  );
}

export default App;
