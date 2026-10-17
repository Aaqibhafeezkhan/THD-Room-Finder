// Mirror of src/components/focus/FocusButton.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { Button } from '../core/Button.jsx';
import { IconTimer } from './focusIcons.jsx';

/**
 * The two focus actions (D1). Start is the filled primary pill, full width on
 * phones, in every startable state; Join is small and violet, inside the batch
 * activity row. During a lecture neither is rendered: hide it, don't disable it.
 */
export function FocusButton({ tone, children, onClick, disabled, fullWidth = false, style = {} }) {
    if (tone === 'join') {
        return (<Button variant="tonal" size="small" onClick={onClick} disabled={disabled} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', flexShrink: 0, ...style }}>
        {children}
      </Button>);
    }
    return (<Button variant="filled" size="large" icon={<IconTimer size={18}/>} onClick={onClick} disabled={disabled} style={{ width: fullWidth ? '100%' : undefined, ...style }}>
      {children}
    </Button>);
}
