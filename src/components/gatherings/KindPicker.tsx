import type { CSSProperties } from 'react';
import type { HallKind } from '../../../shared/hall.js';
import { KindIcon } from './KindIcon';

/**
 * The four gathering kinds as tiles (G1, New gathering): icon over label,
 * the picked one in the focus container. A radiogroup.
 */
export interface KindPickerProps {
  value: HallKind;
  onChange: (kind: HallKind) => void;
  labels: Record<HallKind, string>;
  label: string;
  style?: CSSProperties;
}

const KINDS: HallKind[] = ['focus', 'games', 'talk', 'meeting'];

export function KindPicker({ value, onChange, labels, label, style = {} }: KindPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, ...style }}>
      {KINDS.map((k) => {
        const on = k === value;
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(k)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              minHeight: 64,
              padding: '10px 4px 8px',
              borderRadius: 'var(--radius-m)',
              border: on ? '1px solid transparent' : '1px solid var(--md-outline-variant)',
              background: on ? 'var(--md-focus-container)' : 'var(--md-surface)',
              color: on ? 'var(--md-focus)' : 'var(--md-on-surface-variant)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.2,
              cursor: 'pointer',
            }}
          >
            <KindIcon kind={k} size={28} />
            <span style={{ color: on ? 'var(--md-on-focus-container)' : 'var(--md-on-surface)', textAlign: 'center' }}>{labels[k]}</span>
          </button>
        );
      })}
    </div>
  );
}
