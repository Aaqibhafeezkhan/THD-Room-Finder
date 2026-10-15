import type { CSSProperties, MouseEventHandler } from 'react';
import { IconBreak, IconTimer } from './focusIcons';

/**
 * Your running session, visible from every other screen (D1, D3): trailing in
 * the brand app bar on phones, in the list-pane header on tablet and desktop.
 * Tapping it opens the room. Filled violet while focusing; tonal with a cup
 * during a break or when the next block is waiting (ADR 0004). The aria-label
 * is a full sentence, e.g. "Focus in E 212, 32 minutes left. Open room."
 */
export interface FocusPillProps {
  /** Time left in the phase, e.g. "32:10", or elapsed in the Open rhythm. */
  elapsed: string;
  phase?: 'focus' | 'break' | 'confirm';
  /** Room code, e.g. "E 212". */
  room: string;
  /** Full-sentence accessible name. */
  label: string;
  onOpen?: MouseEventHandler;
  style?: CSSProperties;
}

export function FocusPill({ elapsed, phase = 'focus', room, label, onOpen, style = {} }: FocusPillProps) {
  const focusing = phase === 'focus';
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onOpen}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 36,
        padding: '0 14px 0 10px',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        background: focusing ? 'var(--md-focus)' : 'var(--md-focus-container)',
        color: focusing ? 'var(--md-on-focus)' : 'var(--md-on-focus-container)',
        font: '500 13px var(--font-sans)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        boxShadow: 'var(--md-shadow-1)',
        ...style,
      }}
    >
      {focusing ? <IconTimer size={16} /> : <IconBreak size={16} />}
      <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{elapsed}</span>
      <span>{room}</span>
    </button>
  );
}
