// Mirror of src/components/core/ConfirmDialog.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { Button } from './Button.jsx';
import { Sheet } from './Sheet.jsx';

/**
 * Centred confirmation on every window size (D2 delete profile). alertdialog,
 * initial focus on Cancel, the confirm action in error colour when the tone is
 * danger.
 */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, tone = 'danger', onConfirm, onCancel, contained, }) {
    const danger = tone === 'danger';
    return (<Sheet open={open} onClose={onCancel} label={title} variant="dialog" role="alertdialog" width={360} contained={contained}>
      <div style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.25 }}>{title}</div>
      {body && (<p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--md-on-surface-variant)', textWrap: 'pretty' }}>
          {body}
        </p>)}
      <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <Button variant="text" onClick={onCancel} data-autofocus="">
          {cancelLabel}
        </Button>
        <Button variant="filled" onClick={onConfirm} style={danger ? { background: 'var(--md-error)', color: 'var(--md-on-error)' } : undefined}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>);
}
