import React from 'react';
import {
  Gavel,
  Scale,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  FileText,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import type { SimulatedVerdict } from '../types';

interface VerdictViewProps {
  verdict: SimulatedVerdict;
  onNewHearing: () => void;
  onScrollToTranscript?: () => void;
}

export const VerdictView: React.FC<VerdictViewProps> = ({
  verdict,
  onNewHearing,
  onScrollToTranscript,
}) => {
  const isPetitionerOutcome = verdict.simulated_outcome.toLowerCase().includes('petitioner');
  const isRespondentOutcome = verdict.simulated_outcome.toLowerCase().includes('respondent');
  const userWon =
    (verdict.user_side === 'petitioner' && isPetitionerOutcome) ||
    (verdict.user_side === 'respondent' && isRespondentOutcome);

  return (
    <div className="court-panel" style={{ padding: '32px', border: '1px solid var(--border-gold)', marginBottom: '24px' }}>
      {/* Official Header */}
      <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(184, 147, 43, 0.1) 100%)',
          border: '1px solid var(--border-gold)',
          margin: '0 auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold-primary)',
        }}>
          <Gavel size={28} />
        </div>

        <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          Simulated Bench Ruling & Educational Assessment
        </h2>

        {/* Mandatory Educational Disclaimer */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '30px',
          background: 'rgba(234, 179, 8, 0.12)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          color: '#fde047',
          fontSize: '0.775rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          <ShieldAlert size={15} />
          <span>{verdict.disclaimer}</span>
        </div>
      </div>

      {/* Outcome Banner */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        borderRadius: '10px',
        background: userWon
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(10, 15, 29, 0.7) 100%)'
          : 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(10, 15, 29, 0.7) 100%)',
        border: userWon ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid var(--border-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-light)', fontWeight: 600 }}>
            Simulated Bench Holding
          </div>
          <div className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {verdict.simulated_outcome}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Advocate: <strong>{verdict.user_side.toUpperCase()}</strong> | Opposing Counsel: <strong>{verdict.opposition_side.toUpperCase()}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onNewHearing} className="btn btn-primary">
            <RotateCcw size={16} />
            <span>Start New Moot Docket</span>
          </button>
          {onScrollToTranscript && (
            <button onClick={onScrollToTranscript} className="btn btn-secondary">
              <FileText size={16} />
              <span>Review Transcript</span>
            </button>
          )}
        </div>
      </div>

      {/* Topic Summary */}
      <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: 'rgba(10, 15, 29, 0.5)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px' }}>
          Case Proposition Summary
        </div>
        <p style={{ color: 'var(--text-main)', fontSize: '0.925rem', lineHeight: 1.5, margin: 0 }}>
          {verdict.topic_summary}
        </p>
      </div>

      {/* 2-Column Comparative Analysis */}
      <div style={{
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {/* Student Column */}
        <div style={{
          padding: '20px',
          borderRadius: '10px',
          background: 'rgba(56, 189, 248, 0.04)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="badge badge-petitioner">Your Advocacy ({verdict.user_side.toUpperCase()})</span>
          </div>

          {/* Main Arguments */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--petitioner-blue)', marginBottom: '6px' }}>
              Submissions Advanced:
            </div>
            <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.5 }}>
              {verdict.user_main_arguments.map((arg, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{arg}</li>
              ))}
            </ul>
          </div>

          {/* Strongest Point */}
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.08)', borderLeft: '3px solid var(--petitioner-blue)' }}>
            <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--petitioner-blue)', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Award size={14} /> Strongest Submission
            </div>
            <p style={{ fontSize: '0.85rem', color: '#f1f5f9', margin: 0 }}>
              {verdict.user_strongest_point}
            </p>
          </div>

          {/* Weaknesses / Gaps */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={14} /> Weaknesses & Evidentiary Gaps:
            </div>
            <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {verdict.user_weaknesses_and_gaps.map((w, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Opposition Column */}
        <div style={{
          padding: '20px',
          borderRadius: '10px',
          background: 'rgba(251, 113, 133, 0.04)',
          border: '1px solid rgba(251, 113, 133, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="badge badge-respondent">Opposing Counsel ({verdict.opposition_side.toUpperCase()})</span>
          </div>

          {/* Main Arguments */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--respondent-red)', marginBottom: '6px' }}>
              Counter-Submissions Advanced:
            </div>
            <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.5 }}>
              {verdict.opposition_main_arguments.map((arg, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{arg}</li>
              ))}
            </ul>
          </div>

          {/* Strongest Point */}
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '6px', background: 'rgba(251, 113, 133, 0.08)', borderLeft: '3px solid var(--respondent-red)' }}>
            <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--respondent-red)', textTransform: 'uppercase', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Scale size={14} /> Strongest Counterargument
            </div>
            <p style={{ fontSize: '0.85rem', color: '#f1f5f9', margin: 0 }}>
              {verdict.opposition_strongest_point}
            </p>
          </div>

          {/* Weaknesses / Gaps */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={14} /> Opposition Vulnerabilities:
            </div>
            <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {verdict.opposition_weaknesses_and_gaps.map((w, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Rebuttal Analysis & Judicial Reasoning */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Rebuttal Analysis */}
        <div style={{ padding: '18px', borderRadius: '10px', background: 'rgba(10, 15, 29, 0.6)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.9rem' }}>
            <CheckCircle size={16} />
            Analysis of Oral Rebuttals
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
            {verdict.rebuttal_analysis}
          </p>
        </div>

        {/* Judicial Reasoning */}
        <div style={{ padding: '18px', borderRadius: '10px', background: 'rgba(10, 15, 29, 0.6)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.9rem' }}>
            <Gavel size={16} />
            Bench Legal Reasoning
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
            {verdict.judicial_reasoning}
          </p>
        </div>
      </div>

      {/* Advocacy Improvement Coaching for Student */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 15, 29, 0.7) 100%)',
        border: '1px solid var(--border-gold)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--gold-light)', fontWeight: 700, fontSize: '0.95rem' }}>
          <Lightbulb size={18} color="var(--gold-primary)" />
          Advocacy Feedback & Practice Recommendations
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {verdict.advocacy_feedback_for_user.map((tip, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', color: '#f1f5f9' }}>
              <span style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--gold-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '1px',
              }}>
                {idx + 1}
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
