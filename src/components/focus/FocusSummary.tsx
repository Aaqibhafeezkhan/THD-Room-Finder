import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../core/Button';
import { IconCheckCircle } from './focusIcons';

/**
 * Shown on room detail right after a session ends (D1): what was added to the
 * focus graph, today's total and the streak, and a way to the graph. Start
 * focus sits under it again.
 */
export interface FocusSummaryProps {
  /** "Session ended" */
  title: string;
  /** The minutes just added, e.g. "1 h 25 min". */
  added: string;
  /** "added to your focus graph" */
  addedLabel: string;
  /** "Today 2 h 10 min · 12-day streak" */
  todayLine: ReactNode;
  /** "View Focus Graph" */
  viewGraphLabel: string;
  onViewGraph?: () => void;
  style?: CSSProperties;
}

export function FocusSummary({ title, added, addedLabel, todayLine, viewGraphLabel, onViewGraph, style = {} }: FocusSummaryProps) {
  return (
    <section
      role="status"
      style={{
        background: 'var(--md-focus-container)',
        color: 'var(--md-on-focus-container)',
        borderRadius: 'var(--radius-l)',
        boxShadow: 'var(--md-shadow-1)',
        padding: '16px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
        <IconCheckCircle size={18} />
        <span>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 36,
            fontWeight: 300,
            lineHeight: 1.1,
          }}
        >
          {added}
        </span>
        <span style={{ fontSize: 14 }}>{addedLabel}</span>
      </div>
      <div style={{ fontSize: 13 }}>{todayLine}</div>
      <div style={{ marginLeft: -12 }}>
        <Button variant="text" size="small" onClick={onViewGraph} style={{ color: 'var(--md-on-focus-container)' }}>
          {viewGraphLabel}
        </Button>
      </div>
    </section>
  );
}
