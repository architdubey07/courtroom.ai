import React, { useState } from 'react';
import { Gavel, BookOpen, Sparkles, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import type { Difficulty, Side, SystemHealth } from '../types';

interface SetupScreenProps {
  onStartHearing: (topic: string, side: Side, difficulty: Difficulty) => void;
  isLoading: boolean;
  error: string | null;
  health: SystemHealth | null;
}

const PRESET_TOPICS = [
  {
    title: 'Biometric Surveillance & Public Privacy',
    proposition: 'Whether municipal law enforcement continuous facial recognition surveillance in public transit systems without individualized reasonable suspicion violates constitutional guarantees against unreasonable search and privacy rights.',
    defaultSide: 'petitioner' as Side,
  },
  {
    title: 'Autonomous Vehicle Product Liability',
    proposition: 'Whether the manufacturer of an autonomous self-driving vehicle is strictly liable in tort for a fatal pedestrian collision when unexpected inclement weather blinded external optical sensors, or whether liability falls on the backup human driver.',
    defaultSide: 'respondent' as Side,
  },
  {
    title: 'Digital Speech & Algorithmic Amplification',
    proposition: 'Whether a digital platform that actively amplifies defamatory viral content through predictive engagement algorithms forfeits statutory intermediary immunity and incurs direct publisher liability in defamation.',
    defaultSide: 'petitioner' as Side,
  },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartHearing,
  isLoading,
  error,
  health,
}) => {
  const [topic, setTopic] = useState('');
  const [side, setSide] = useState<Side>('petitioner');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setValidationError('Please enter a moot court proposition or select a sample topic.');
      return;
    }
    if (topic.trim().length < 10) {
      setValidationError('Proposition must be at least 10 characters long to provide sufficient legal controversy.');
      return;
    }
    setValidationError(null);
    onStartHearing(topic.trim(), side, difficulty);
  };

  const handleSelectPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setTopic(preset.proposition);
    setSide(preset.defaultSide);
    setValidationError(null);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Intro Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1px solid var(--border-gold)',
          color: 'var(--gold-light)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '16px',
        }}>
          <Sparkles size={16} />
          Moot Court Hearing Preparation
        </div>

        <h1 className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', lineHeight: 1.2 }}>
          Convene Your Moot Court
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
          Test your oral advocacy and legal reasoning against an adversarial AI Opposition Counsel under the scrutiny of an impartial AI Presiding Judge.
        </p>
      </div>

      {/* Error or Warning Banner */}
      {(error || validationError) && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#fca5a5',
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Unable to Proceed</div>
            <div style={{ fontSize: '0.875rem', marginTop: '4px', lineHeight: 1.5 }}>
              {error || validationError}
            </div>
          </div>
        </div>
      )}

      {/* API Key Missing Alert if detected */}
      {health && !health.llm_configured && !error && (
        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          color: '#fef08a',
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#facc15' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fde047' }}>Backend LLM Key Required</div>
            <p style={{ fontSize: '0.875rem', marginTop: '4px', color: '#fef9c3', lineHeight: 1.5 }}>
              To generate judicial queries and opposition arguments, set <code>GEMINI_API_KEY</code> or <code>OPENAI_API_KEY</code> in <code>backend/.env</code>, then restart or refresh.
            </p>
          </div>
        </div>
      )}

      {/* Main Setup Form Card */}
      <div className="court-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          {/* Proposition / Topic input */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="var(--gold-primary)" />
                Case Proposition or Legal Issue
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Hypothetical Moot Problem
              </span>
            </div>

            <textarea
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Enter the moot court proposition, statutory controversy, or constitutional dispute you wish to argue..."
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(10, 15, 29, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.5,
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--gold-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />

            {/* Presets Quick Picker */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                Or select a sample moot proposition to practise immediately:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_TOPICS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      background: 'rgba(36, 50, 79, 0.4)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gold-primary)';
                      e.currentTarget.style.color = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    ⚖️ {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Side Selection */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
              Select Your Role / Party
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {/* Petitioner Card */}
              <div
                onClick={() => setSide('petitioner')}
                style={{
                  border: side === 'petitioner' ? '2px solid var(--petitioner-blue)' : '1px solid var(--border-subtle)',
                  background: side === 'petitioner' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(10, 15, 29, 0.4)',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--petitioner-blue)', fontSize: '1rem' }}>
                    Petitioner / Appellant
                  </span>
                  <span className="badge badge-petitioner">You</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Argues for relief, challenges existing lower court judgment, and establishes legal violations. Opposition Counsel will represent Respondent.
                </p>
              </div>

              {/* Respondent Card */}
              <div
                onClick={() => setSide('respondent')}
                style={{
                  border: side === 'respondent' ? '2px solid var(--respondent-red)' : '1px solid var(--border-subtle)',
                  background: side === 'respondent' ? 'rgba(251, 113, 133, 0.08)' : 'rgba(10, 15, 29, 0.4)',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--respondent-red)', fontSize: '1rem' }}>
                    Respondent / Appellee
                  </span>
                  <span className="badge badge-respondent">You</span>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Defends existing judgment, upholds doctrine or government action, and refutes claims. Opposition Counsel will represent Petitioner.
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', display: 'block', marginBottom: '10px' }}>
              Select Difficulty & Judicial Rigor
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Easy */}
              <div
                onClick={() => setDifficulty('easy')}
                style={{
                  border: difficulty === 'easy' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  background: difficulty === 'easy' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(10, 15, 29, 0.4)',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '4px', fontSize: '0.95rem' }}>
                  Easy
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                  Basic counterarguments, accessible legal reasoning, one manageable challenge at a time.
                </p>
              </div>

              {/* Medium */}
              <div
                onClick={() => setDifficulty('medium')}
                style={{
                  border: difficulty === 'medium' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  background: difficulty === 'medium' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(10, 15, 29, 0.4)',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '4px', fontSize: '0.95rem' }}>
                  Medium (Recommended)
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                  Disciplined counterarguments, questions on evidentiary gaps and weak causation.
                </p>
              </div>

              {/* Hard */}
              <div
                onClick={() => setDifficulty('hard')}
                style={{
                  border: difficulty === 'hard' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                  background: difficulty === 'hard' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(10, 15, 29, 0.4)',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '4px', fontSize: '0.95rem' }}>
                  Hard (Elite Moot)
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                  Piercing hypotheticals, scrutiny of inconsistencies, zero concession to unsupported assumptions.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div style={{
            background: 'rgba(10, 15, 29, 0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
          }}>
            <Info size={18} style={{ flexShrink: 0, color: 'var(--gold-primary)' }} />
            <span>
              <strong>Simulated Practice Notice:</strong> All arguments, judicial interventions, and legal propositions are treated strictly as hypothetical academic exercises for moot court training.
            </span>
          </div>

          {/* Submit / Start Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '1.05rem',
              letterSpacing: '0.02em',
            }}
          >
            {isLoading ? (
              <>
                <span className="animate-pulse-slow">Convening the Court & Preparing the Bench...</span>
              </>
            ) : (
              <>
                <Gavel size={20} />
                <span>Start Hearing & Present to the Bench</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
