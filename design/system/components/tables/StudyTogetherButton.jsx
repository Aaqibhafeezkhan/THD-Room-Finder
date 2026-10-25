// Mirror of src/components/tables/StudyTogetherButton.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { IconGroup } from '../focus/focusIcons.jsx';

/**
 * Study together on room detail (T1). While your own focus session runs in
 * the room, a focus-violet shortcut sits at the pill's left end: it turns
 * that session into a study table already in progress (#153), and the label
 * moves right, centred in the space that is left. Two separate buttons, each
 * at least 48 px tall, so neither steals the other's tap.
 */
const pill = {
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: 'var(--radius-full)',
    background: 'var(--md-secondary-container)',
    color: 'var(--md-on-secondary-container)',
    fontFamily: 'var(--font-sans)',
};
const reset = {
    border: 'none',
    cursor: 'pointer',
    font: 'inherit',
    color: 'inherit',
    background: 'transparent',
};
export function StudyTogetherButton({ label, onClick, convert, style = {} }) {
    return (<div className="thd-study-together" style={{ ...pill, ...style }}>
      {convert && (<button type="button" aria-label={convert.label} title={convert.label} onClick={convert.onClick} style={{
                ...reset,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                width: 48,
                height: 48,
                margin: 4,
                borderRadius: '50%',
                background: 'var(--md-focus)',
                color: 'var(--md-on-focus)',
            }}>
          <IconGroup size={22}/>
        </button>)}
      <button type="button" onClick={onClick} style={{
            ...reset,
            flex: 1,
            alignSelf: 'stretch',
            minHeight: 56,
            // Centred in what is left; mirrors the shortcut's width so the
            // label sits in the visual middle of the remaining area.
            padding: convert ? '0 calc(1.25rem + 4px) 0 0.75rem' : '0 1.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.9375rem',
            fontWeight: 500,
        }}>
        {label}
      </button>
      <style>{'.thd-study-together button:focus-visible{outline:2px solid var(--md-primary);outline-offset:2px}'}</style>
    </div>);
}
