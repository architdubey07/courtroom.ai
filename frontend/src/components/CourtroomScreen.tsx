import React, { useState, useRef, useEffect } from 'react';
import {
  Gavel,
  Scale,
  User,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import type { HearingSession } from '../types';
import { VerdictView } from './VerdictView';

interface CourtroomScreenProps {
  session: HearingSession;
  onSubmitArgument: (argument: string) => Promise<void>;
  onEndHearing: () => Promise<void>;
  onNewHearing: () => void;
  isLoading: boolean;
  error: string | null;
}

export const CourtroomScreen: React.FC<CourtroomScreenProps> = ({
  session,
  onSubmitArgument,
  onEndHearing,
  onNewHearing,
  isLoading,
  error,
}) => {
  const [argumentText, setArgumentText] = useState('');
  const [showFullTopic, setShowFullTopic] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const transcriptTopRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll transcript on new message or loading
  useEffect(() => {
    if (!session.verdict) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages, isLoading, session.verdict]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!argumentText.trim() || isLoading || !session.is_active || session.is_processing) return;

    const text = argumentText.trim();
    setArgumentText('');
    await onSubmitArgument(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const scrollToTranscript = () => {
    transcriptTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const userSideLabel = session.user_side === 'petitioner' ? 'Petitioner' : 'Respondent';
  const oppSideLabel = session.opposition_side === 'petitioner' ? 'Petitioner' : 'Respondent';

  // Find latest Judge question or directive
  const latestJudgeMsg = [...session.messages]
    .reverse()
    .find((m) => m.speaker === 'judge');

  // Find latest Opposition submission
  const latestOppMsg = [...session.messages]
    .reverse()
    .find((m) => m.speaker === 'opposition');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Docket Bar */}
      <div className="court-panel" style={{ padding: '14px 20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          {/* Proposition / Case Info */}
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                MOOT CASE PROPOSITION
              </span>
              <span className={`badge ${session.user_side === 'petitioner' ? 'badge-petitioner' : 'badge-respondent'}`}>
                You: {userSideLabel}
              </span>
              <span className="badge badge-subtle">
                Difficulty: {session.difficulty.toUpperCase()}
              </span>
              <span className="badge badge-subtle">
                Round {session.current_round}
              </span>
              {session.is_active ? (
                <span className="badge badge-gold" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                  Active Hearing
                </span>
              ) : (
                <span className="badge badge-gold">
                  Hearing Concluded
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <p style={{
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontWeight: 500,
                lineHeight: 1.4,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: showFullTopic ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {session.topic}
              </p>
              {session.topic.length > 120 && (
                <button
                  onClick={() => setShowFullTopic(!showFullTopic)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--gold-primary)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showFullTopic ? 'Collapse topic' : 'Expand full topic'}
                >
                  {showFullTopic ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* End Hearing Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {session.is_active ? (
              showEndConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <AlertTriangle size={15} color="#fca5a5" />
                  <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>Adjourn & get verdict?</span>
                  <button
                    onClick={() => {
                      setShowEndConfirm(false);
                      onEndHearing();
                    }}
                    disabled={isLoading}
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Yes, Render Verdict
                  </button>
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    disabled={isLoading}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={isLoading}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <Clock size={15} />
                  <span>Conclude Hearing & Render Verdict</span>
                </button>
              )
            ) : (
              <button
                onClick={onNewHearing}
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                <span>Start New Docket</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#fca5a5',
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.9rem' }}>{error}</div>
        </div>
      )}

      {/* Structured Verdict Banner if Hearing has Concluded */}
      {session.verdict && (
        <VerdictView
          verdict={session.verdict}
          onNewHearing={onNewHearing}
          onScrollToTranscript={scrollToTranscript}
        />
      )}

      {/* Anchor for scrolling back to transcript */}
      <div ref={transcriptTopRef} />

      {/* Main 3-Column Courtroom Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 320px) minmax(460px, 1fr) minmax(280px, 320px)',
        gap: '16px',
        alignItems: 'start',
      }}
      className="courtroom-grid"
      >
        {/* LEFT COLUMN: Presiding Judge Bench */}
        <div className="court-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(184, 147, 43, 0.1) 100%)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)',
            }}>
              <Gavel size={24} />
            </div>
            <div>
              <div className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Presiding Judge
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)' }}>
                Neutral Judicial Bench
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
              Bench Status
            </div>
            <div style={{
              background: 'rgba(10, 15, 29, 0.6)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              padding: '12px',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              {session.is_active ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#86efac', fontWeight: 600, marginBottom: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Actively Presiding
                  </div>
                  Managing oral submissions, scrutinizing legal arguments, and testing counsel on points of law.
                </>
              ) : (
                <div style={{ color: 'var(--gold-primary)' }}>
                  Hearing is formally adjourned. Bench deliberations concluded and final simulated verdict rendered.
                </div>
              )}
            </div>
          </div>

          {/* Latest Judicial Interlocutory Highlight */}
          {latestJudgeMsg && (
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
                Latest Judicial Directive
              </div>
              <div style={{
                background: 'rgba(212, 175, 55, 0.06)',
                borderRadius: '8px',
                border: '1px solid var(--border-gold)',
                padding: '12px',
                fontSize: '0.825rem',
                color: '#fef08a',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--gold-light)' }}>
                  Round {latestJudgeMsg.round_number} Focus:
                </div>
                <div style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  "{latestJudgeMsg.content}"
                </div>
              </div>
            </div>
          )}

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            lineHeight: 1.4,
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <strong>Advocacy Tip:</strong> Address the Bench with decorum. Answer questions directly before advancing to secondary points.
          </div>
        </div>

        {/* CENTER COLUMN: Central Hearing Transcript & Submission Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '620px' }}>
          {/* Turn Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'rgba(10, 15, 29, 0.7)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
          }}>
            <span style={{ color: 'var(--text-dim)' }}>Floor Status:</span>
            {isLoading ? (
              <span style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '6px' }} className="animate-pulse-slow">
                <Sparkles size={15} />
                <span>Bench & Opposition deliberating...</span>
              </span>
            ) : session.is_active ? (
              <span style={{ color: 'var(--petitioner-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} />
                <span>Your turn to submit ({userSideLabel} Counsel)</span>
              </span>
            ) : (
              <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>
                Hearing Concluded
              </span>
            )}
          </div>

          {/* Transcript Scroll Area */}
          <div
            className="court-panel"
            style={{
              padding: '20px',
              height: '520px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Convening Seal Header */}
            <div style={{ textAlign: 'center', padding: '12px 0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="font-serif" style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', letterSpacing: '0.1em' }}>
                OFFICIAL RECORD OF ORAL SUBMISSIONS
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Session: {session.session_id.slice(0, 8)}... | Difficulty: {session.difficulty.toUpperCase()}
              </div>
            </div>

            {/* Hearing Messages */}
            {session.messages.map((msg) => {
              const isJudge = msg.speaker === 'judge';
              const isOpp = msg.speaker === 'opposition';
              const isUser = msg.speaker === 'user';

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: isJudge
                      ? 'rgba(212, 175, 55, 0.05)'
                      : isOpp
                      ? 'rgba(251, 113, 133, 0.05)'
                      : 'rgba(56, 189, 248, 0.05)',
                    border: `1px solid ${
                      isJudge
                        ? 'var(--border-gold)'
                        : isOpp
                        ? 'rgba(251, 113, 133, 0.25)'
                        : 'rgba(56, 189, 248, 0.25)'
                    }`,
                  }}
                >
                  {/* Speaker Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isJudge && <Gavel size={16} color="var(--gold-primary)" />}
                      {isOpp && <Scale size={16} color="var(--respondent-red)" />}
                      {isUser && <User size={16} color="var(--petitioner-blue)" />}
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: isJudge
                          ? 'var(--gold-light)'
                          : isOpp
                          ? 'var(--respondent-red)'
                          : 'var(--petitioner-blue)',
                      }}>
                        {msg.speaker_title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-subtle" style={{ fontSize: '0.65rem' }}>
                        Round {msg.round_number}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div style={{
                    fontSize: '0.92rem',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    marginTop: '4px',
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Generating Loading State */}
            {isLoading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px dashed var(--border-gold)',
                  color: 'var(--gold-light)',
                  fontSize: '0.875rem',
                }}
                className="animate-pulse-slow"
              >
                <Sparkles size={18} />
                <span>
                  The Bench and Opposing Counsel are analyzing arguments and drafting submissions...
                </span>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* User Argument Input Bar */}
          {session.is_active ? (
            <div className="court-panel" style={{ padding: '16px' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} color="var(--petitioner-blue)" />
                    Your Submission ({userSideLabel} Counsel)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Press <strong>Ctrl + Enter</strong> to submit
                  </span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={argumentText}
                  onChange={(e) => setArgumentText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`May it please the Court, the ${userSideLabel} submits that...`}
                  rows={4}
                  disabled={isLoading || !session.is_active || session.is_processing}
                  style={{
                    width: '100%',
                    background: 'rgba(10, 15, 29, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: 'var(--text-main)',
                    fontSize: '0.925rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--petitioner-blue)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {argumentText.trim().split(/\s+/).filter(Boolean).length} words | {argumentText.length} characters
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !argumentText.trim() || !session.is_active || session.is_processing}
                    className="btn btn-primary"
                    style={{ padding: '9px 20px', fontSize: '0.9rem' }}
                  >
                    {isLoading ? (
                      <span>Court Deliberating...</span>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Argument</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="court-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gold-light)', fontWeight: 600, marginBottom: '6px' }}>
                <CheckCircle2 size={18} />
                Hearing Formally Adjourned
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0 }}>
                This moot hearing has concluded and the Bench's simulated educational verdict has been rendered above.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Opposition Counsel Bench */}
        <div className="court-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.25) 0%, rgba(239, 68, 68, 0.1) 100%)',
              border: '1px solid rgba(251, 113, 133, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--respondent-red)',
            }}>
              <Scale size={24} />
            </div>
            <div>
              <div className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                Opposition Counsel
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--respondent-red)' }}>
                Learned Counsel for the {oppSideLabel}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
              Adversarial Posture
            </div>
            <div style={{
              background: 'rgba(10, 15, 29, 0.6)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              padding: '12px',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                Mode: {session.difficulty.toUpperCase()}
              </div>
              {session.difficulty === 'easy' && 'Focusing on single manageable challenges and clear doctrinal principles.'}
              {session.difficulty === 'medium' && 'Targeting weak factual links, unsupported assumptions, and evidentiary gaps.'}
              {session.difficulty === 'hard' && 'Posing adverse hypotheticals, testing extreme bounds, and dissecting logical contradictions.'}
            </div>
          </div>

          {/* Latest Opposition Rebuttal Highlight */}
          {latestOppMsg && (
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>
                Latest Opposition Counter
              </div>
              <div style={{
                background: 'rgba(251, 113, 133, 0.06)',
                borderRadius: '8px',
                border: '1px solid rgba(251, 113, 133, 0.25)',
                padding: '12px',
                fontSize: '0.825rem',
                color: '#fecdd3',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--respondent-red)' }}>
                  Round {latestOppMsg.round_number} Rebuttal:
                </div>
                <div style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  "{latestOppMsg.content}"
                </div>
              </div>
            </div>
          )}

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            lineHeight: 1.4,
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <strong>Opponent Strategy:</strong> The opposition will vigorously defend the {oppSideLabel}'s stance and will never concede easily. Frame robust responses to their counterarguments.
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .courtroom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
