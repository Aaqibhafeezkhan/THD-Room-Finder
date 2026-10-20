// Mirror of src/components/gatherings/VerifiedTag.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/**
 * The group behind a gathering with its verified shield (M3), top right of
 * the card. A link to the group's page when `onClick` is given. A group that
 * is no longer verified shows without the shield, in grey.
 */
export function VerifiedTag({ name, verified = true, verifiedLabel, onClick, style = {} }) {
    const body = (<>
      {verified && (<svg width="15" height="15" viewBox="0 0 24 24" role="img" aria-label={verifiedLabel}>
          <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3Z"/>
        </svg>)}
      <span>{name}</span>
    </>);
    const look = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 500,
        color: verified ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
        background: 'none',
        border: 'none',
        padding: 0,
        minHeight: 24,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
    };
    return onClick ? (<button type="button" onClick={onClick} style={look}>{body}</button>) : (<span style={look}>{body}</span>);
}
