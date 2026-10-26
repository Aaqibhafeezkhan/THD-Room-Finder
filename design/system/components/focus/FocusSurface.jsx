// Mirror of src/components/focus/FocusSurface.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { Button } from '../core/Button.jsx';
import { SegmentedControl } from '../core/SegmentedControl.jsx';
import { Switch } from '../core/Switch.jsx';
import { IconBreak, IconCampus, IconGroup, IconHome, IconLock, IconMute, IconPhone, IconSound, IconTimer } from './focusIcons.jsx';

/**
 * The running session on room detail (D1, ADR 0004): a violet focus-container
 * card with the phase ("Focus", "Break", "Break's over") and block count, a
 * countdown to the end of the phase, a track of blocks and breaks, the planned
 * end and why, Private | Public (Private is the default), one plain line on
 * what others see, "Show my name" in Public only, the lock-screen note and
 * End. When a break is over, "Start block 3" leads. Without a study profile
 * the session runs on the device: no visibility control, a line saying the
 * room is not claimed, and Set Up Study Profile.
 * On the Focus tab (ADR 0011) a chip names the place ("At home", "C211"), a
 * plain note replaces the controls, breaks carry a tip, and wide windows get
 * a larger timer. A speaker button turns the session's sounds off and on
 * (ADR 0012): next to the place chip, or at the end of the title row.
 * Focus order: Start block → timer → visibility → name → End.
 */
function SoundButton({ on, label, onToggle }) {
    return (<button type="button" className="thd-icon-button" aria-label={label} aria-pressed={on} title={label} onClick={onToggle} style={{
            width: 40,
            height: 40,
            margin: '-8px -8px -8px 0',
            flexShrink: 0,
            borderRadius: '50%',
            border: 'none',
            background: on ? 'transparent' : 'var(--focus-state-layer)',
            color: 'inherit',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
        }}>
      {on ? <IconSound size={20}/> : <IconMute size={20}/>}
    </button>);
}
function PlaceChip({ home, label }) {
    return (<span style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 28,
            padding: '0 10px 0 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--focus-state-layer)',
            fontSize: 13,
            fontWeight: 500,
        }}>
      {home ? <IconHome size={16}/> : <IconCampus size={16}/>}
      {label}
    </span>);
}
function Track({ segments }) {
    return (<div aria-hidden="true" style={{ display: 'flex', gap: 3, alignItems: 'center', height: 8 }}>
      {segments.map((seg, i) => {
            const fill = seg.state === 'done' ? 1 : seg.state === 'now' ? Math.min(1, Math.max(0, seg.progress ?? 0)) : 0;
            const tall = seg.kind === 'focus';
            return (<span key={i} style={{
                    flex: `${seg.minutes} 1 0`,
                    minWidth: 4,
                    height: tall ? 8 : 4,
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    background: 'var(--focus-state-layer)',
                    outline: seg.state === 'now' ? '1px solid var(--md-on-focus-container)' : 'none',
                    outlineOffset: 1,
                }}>
            <span style={{
                    display: 'block',
                    width: `${fill * 100}%`,
                    height: '100%',
                    background: tall ? 'var(--md-on-focus-container)' : 'var(--md-focus)',
                    opacity: tall ? 1 : 0.6,
                }}/>
          </span>);
        })}
    </div>);
}
export function FocusSurface({ elapsed, elapsedLabel, phase = 'focus', phaseLabel, track, confirmLabel, onConfirm, plannedLine, visibility, showName, signedIn, text, onVisibility, onShowName, onEnd, onSetup, place, note, tip, action, large = false, sound, soundHint, style = {}, }) {
    const onFocusText = { color: 'var(--md-on-focus-container)' };
    return (<section aria-label={text.title} style={{
            background: 'var(--md-focus-container)',
            color: 'var(--md-on-focus-container)',
            borderRadius: 'var(--radius-l)',
            boxShadow: 'var(--md-shadow-1)',
            padding: large ? 24 : 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            fontFamily: 'var(--font-sans)',
            ...style,
        }}>
      {place && (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <PlaceChip home={place.home} label={place.label}/>
          {sound && <SoundButton {...sound}/>}
        </div>)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
        {phase === 'focus' ? <IconTimer size={18}/> : <IconBreak size={18}/>}
        <span style={{ flex: 1, minWidth: 0 }}>{text.title}</span>
        {phaseLabel && <span style={{ fontWeight: 400, fontSize: 13 }}>{phaseLabel}</span>}
        {!place && sound && <SoundButton {...sound}/>}
      </div>
      {phase === 'confirm' && confirmLabel && (<Button variant="filled" onClick={onConfirm} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', alignSelf: 'stretch' }}>
          {confirmLabel}
        </Button>)}
      <div>
        <div role="timer" aria-label={elapsedLabel} style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: phase === 'confirm' ? 32 : large ? 72 : 48,
            fontWeight: 300,
            lineHeight: 1,
        }}>
          {elapsed}
        </div>
        {track && track.length > 1 && (<div style={{ marginTop: 12 }}>
            <Track segments={track}/>
          </div>)}
        <div style={{ fontSize: 13, marginTop: 8 }}>{plannedLine}</div>
        {soundHint && <div style={{ fontSize: 13, marginTop: 4, fontWeight: 500 }}>{soundHint}</div>}
      </div>

      {phase === 'break' && tip && (<div style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 'var(--radius-m)',
                background: 'var(--focus-state-layer)',
                fontSize: 13,
            }}>
          <IconBreak size={16}/>
          <span>{tip}</span>
        </div>)}

      {note !== undefined ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, textWrap: 'pretty' }}>{note}</p>
          {action && <div style={{ marginLeft: -12 }}>{action}</div>}
        </div>) : signedIn ? (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          {onSetup && (<div style={{ marginLeft: -12 }}>
              <Button variant="text" size="small" onClick={onSetup} style={onFocusText}>
                {text.setup}
              </Button>
            </div>)}
        </div>)}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.4, textWrap: 'pretty' }}>{text.lockedNote}</span>
        <Button variant="outlined" onClick={onEnd} style={{ ...onFocusText, borderColor: 'var(--md-on-focus-container)', flexShrink: 0 }}>
          {text.end}
        </Button>
      </div>
    </section>);
}
