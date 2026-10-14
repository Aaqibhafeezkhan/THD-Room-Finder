// Mirror of src/components/focus/FocusSurface.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { Button } from '../core/Button.jsx';
import { SegmentedControl } from '../core/SegmentedControl.jsx';
import { Switch } from '../core/Switch.jsx';
import { IconGroup, IconLock, IconPhone, IconTimer } from './focusIcons.jsx';

/**
 * The running session on room detail (D1): a violet focus-container card with
 * the timer, the planned end and why, Private | Public (Private is the
 * default), one plain line on what others see, "Show my name" in Public only,
 * the lock-screen note and End. Signed out it is a local timer: no visibility
 * control, a line saying the room is not claimed, and Set Up Study Profile.
 * Focus order: timer → visibility → name → End.
 */
export function FocusSurface({ elapsed, elapsedLabel, plannedLine, visibility, showName, signedIn, text, onVisibility, onShowName, onEnd, onSetup, style = {}, }) {
    const onFocusText = { color: 'var(--md-on-focus-container)' };
    return (<section aria-label={text.title} style={{
            background: 'var(--md-focus-container)',
            color: 'var(--md-on-focus-container)',
            borderRadius: 'var(--radius-l)',
            boxShadow: 'var(--md-shadow-1)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            fontFamily: 'var(--font-sans)',
            ...style,
        }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
        <IconTimer size={18}/>
        <span>{text.title}</span>
      </div>
      <div>
        <div role="timer" aria-label={elapsedLabel} style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 48,
            fontWeight: 300,
            lineHeight: 1,
        }}>
          {elapsed}
        </div>
        <div style={{ fontSize: 13, marginTop: 8 }}>{plannedLine}</div>
      </div>

      {signedIn ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SegmentedControl tone="focus" label={text.visibility} value={visibility} onChange={onVisibility} options={[
                { id: 'private', label: text.private, icon: <IconLock size={16}/> },
                { id: 'public', label: text.public, icon: <IconGroup size={16}/> },
            ]}/>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, textWrap: 'pretty' }}>
            {visibility === 'private' ? text.explainPrivate : text.explainPublic}
          </p>
          {visibility === 'public' && (<Switch tone="focus" checked={showName} onChange={onShowName} label={text.showName} sub={text.nameSub}/>)}
        </div>) : (<div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 12,
                borderRadius: 'var(--radius-m)',
                background: 'var(--focus-state-layer)',
            }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.45 }}>
            <span style={{ marginTop: 1 }}>
              <IconPhone size={16}/>
            </span>
            <span style={{ textWrap: 'pretty' }}>{text.signedOut}</span>
          </div>
          <div style={{ marginLeft: -12 }}>
            <Button variant="text" size="small" onClick={onSetup} style={onFocusText}>
              {text.setup}
            </Button>
          </div>
        </div>)}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.4, textWrap: 'pretty' }}>{text.lockedNote}</span>
        <Button variant="outlined" onClick={onEnd} style={{ ...onFocusText, borderColor: 'var(--md-on-focus-container)', flexShrink: 0 }}>
          {text.end}
        </Button>
      </div>
    </section>);
}
