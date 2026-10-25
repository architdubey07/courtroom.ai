import React from 'react';
import { Scale, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { SystemHealth } from '../types';

interface NavbarProps {
  health: SystemHealth | null;
  currentRound?: number;
  isInHearing: boolean;
  onNewHearing?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  currentRound,
  isInHearing,
  onNewHearing,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Brand / Crest */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-primary)',
          }}>
            <Scale size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-serif" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                LEXSIMULATOR
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>MOOT COURT AI</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
              AI Courtroom Argument & Rebuttal Simulator
            </p>
          </div>
        </div>

        {/* Right Status Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isInHearing && currentRound && (
            <div className="badge badge-gold" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--gold-primary)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--gold-primary)',
              }} />
              Round {currentRound} Active
            </div>
          )}

          {/* Backend / LLM status */}
          {health ? (
            health.llm_configured ? (
              <div className="badge badge-subtle" style={{ color: '#86efac', borderColor: 'rgba(34, 197, 94, 0.3)' }} title={`Provider: ${health.provider} (${health.default_model})`}>
                <ShieldCheck size={14} />
                <span>AI Engine Ready</span>
              </div>
            ) : (
              <div className="badge badge-subtle" style={{ color: '#fcd34d', borderColor: 'rgba(234, 179, 8, 0.3)' }} title="API Key missing in backend/.env">
                <AlertTriangle size={14} />
                <span>API Key Required</span>
              </div>
            )
          ) : (
            <div className="badge badge-subtle" style={{ color: 'var(--text-dim)' }}>
              Connecting...
            </div>
          )}

          {isInHearing && onNewHearing && (
            <button
              onClick={onNewHearing}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              New Docket
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
