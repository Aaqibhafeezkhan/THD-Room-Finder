// Mirror of src/components/tables/ReplyBar.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { Button } from '../core/Button.jsx';

/**
 * The guest's three replies to a study table (M2). Take a seat is filled
 * violet; Maybe and Can't are text buttons. Seated or maybe: a status line
 * with the other two answers. Full: Take a seat is disabled, Maybe stays.
 * The host never sees this bar.
 */
const violet = { background: 'var(--md-focus)', color: 'var(--md-on-focus)' };
const status = { flex: 1, minWidth: 0, fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' };
export function ReplyBar({ answer, full = false, busy = false, onReply, text, inline = false, style = {} }) {
    if (answer) {
        return (<div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', ...style }}>
        <span role="status" style={status}>{answer === 'seat' ? text.seated : text.maybeStatus}</span>
        {answer === 'maybe' ? (<Button variant="text" disabled={busy || full} onClick={() => onReply('seat')}>{full ? text.full : text.seat}</Button>) : (<Button variant="text" disabled={busy} onClick={() => onReply('maybe')}>{text.maybe}</Button>)}
        <Button variant="text" disabled={busy} onClick={() => onReply('no')}>{text.cant}</Button>
      </div>);
    }
    return (<div style={{
            display: 'flex',
            flexDirection: inline ? 'row' : 'column',
            alignItems: inline ? 'center' : 'stretch',
            gap: inline ? 4 : 2,
            ...style,
        }}>
      <Button variant="filled" size="large" disabled={busy || full} onClick={() => onReply('seat')} style={{ ...violet, width: inline ? undefined : '100%' }}>
        {full ? text.full : text.seat}
      </Button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
        <Button variant="text" disabled={busy} onClick={() => onReply('maybe')}>{text.maybe}</Button>
        <Button variant="text" disabled={busy} onClick={() => onReply('no')}>{inline ? text.cant : text.cantLong}</Button>
      </div>
    </div>);
}
