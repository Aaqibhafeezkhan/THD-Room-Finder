// Mirror of src/components/tables/SlotChips.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/**
 * Two rows of chips for setting a table (M2): days, then that day's free
 * slots in one room, cut to the lecture grid. Day chips use the focus
 * container when picked; slot chips use teal (free). A slot shows its start
 * and, small, how long the room stays free. Closed days are shown, not
 * selectable. `slots = null` shows skeleton chips while the day loads.
 */
const chip = (on, tone, disabled = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 'var(--tap-target)',
    padding: '0 14px',
    borderRadius: 'var(--radius-s)',
    border: on ? '1px solid transparent' : '1px solid var(--md-outline-variant)',
    background: on
        ? tone === 'focus'
            ? 'var(--md-focus-container)'
            : 'var(--md-tertiary-container)'
        : 'var(--md-surface)',
    color: on
        ? tone === 'focus'
            ? 'var(--md-on-focus-container)'
            : 'var(--md-on-tertiary-container)'
        : 'var(--md-on-surface)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
});
const row = { display: 'flex', flexWrap: 'wrap', gap: 8 };
export function SlotChips({ days, day, onDay, slots, slot, onSlot, empty, daysLabel, slotsLabel, style = {} }) {
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      <div role="radiogroup" aria-label={daysLabel} style={row}>
        {days.map((d) => (<button key={d.id} type="button" role="radio" aria-checked={d.id === day} aria-disabled={d.disabled || undefined} onClick={() => !d.disabled && onDay(d.id)} style={chip(d.id === day, 'focus', d.disabled)}>
            {d.label}
            {d.note && <small style={{ fontWeight: 400 }}>· {d.note}</small>}
          </button>))}
      </div>
      <div role="radiogroup" aria-label={slotsLabel} aria-busy={slots === null || undefined} style={row}>
        {slots === null
            ? [0, 1, 2].map((i) => (<span key={i} aria-hidden style={{ width: 92, height: 44, borderRadius: 'var(--radius-s)', background: 'var(--md-surface-variant)' }}/>))
            : slots.length === 0
                ? <span style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)', padding: '10px 0' }}>{empty}</span>
                : slots.map((s) => (<button key={s.id} type="button" role="radio" aria-checked={s.id === slot} onClick={() => onSlot(s.id)} style={chip(s.id === slot, 'free')}>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.start}</span>
                  <small style={{ fontWeight: 400, color: s.id === slot ? undefined : 'var(--md-on-surface-variant)' }}>{s.free}</small>
                </button>))}
      </div>
    </div>);
}
