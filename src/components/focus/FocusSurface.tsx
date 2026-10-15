import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../core/Button';
import { SegmentedControl } from '../core/SegmentedControl';
import { Switch } from '../core/Switch';
import { IconBreak, IconGroup, IconLock, IconPhone, IconTimer } from './focusIcons';

/**
 * The running session on room detail (D1, ADR 0004): a violet focus-container
 * card with the phase ("Focus", "Break", "Break's over") and block count, a
 * countdown to the end of the phase, a track of blocks and breaks, the planned
 * end and why, Private | Public (Private is the default), one plain line on
 * what others see, "Show my name" in Public only, the lock-screen note and
 * End. When a break is over, "Start block 3" leads. Without a study profile
 * the session runs on the device: no visibility control, a line saying the
 * room is not claimed, and Set Up Study Profile.
 * Focus order: Start block → timer → visibility → name → End.
 */
export type FocusVisibility = 'private' | 'public';
export type FocusPhase = 'focus' | 'break' | 'confirm';

/** One block or break on the track; `progress` 0–1 on the current one. */
export interface FocusTrackSegment {
  kind: 'focus' | 'break';
  minutes: number;
  state: 'done' | 'now' | 'next';
  progress?: number;
}

export interface FocusSurfaceText {
  /** The phase: "Focus", "Break" or "Break's over". */
  title: string;
  /** "Private" */
  private: string;
  /** "Public · AIN 7" */
  public: string;
  /** Group name for the segmented control, "Who sees this session". */
  visibility: string;
  /** "Others see that someone is focusing here, not who." */
  explainPrivate: string;
  /** "AIN 7 sees you here and can join. Everyone else sees a focus session." */
  explainPublic: string;
  /** "Show my name" */
  showName: string;
  /** 'Shown as "AIN 7 student"' / "Shown as Lena", matching showName. */
  nameSub: string;
  /** "Keeps running when your phone is locked. After each break, tap to start the next block." */
  lockedNote: string;
  /** "End" */
  end: string;
  /** Signed out: "Only you see this timer; the room doesn't show as claimed. …" */
  signedOut: string;
  /** "Set Up Study Profile" */
  setup: string;
}

export interface FocusSurfaceProps {
  /** The big timer: time left in the phase ("32:10"), or elapsed in Open. */
  elapsed: string;
  /** Full-sentence timer label, e.g. "32 minutes left in block 2". */
  elapsedLabel?: string;
  phase?: FocusPhase;
  /** "Block 2 of 3" */
  phaseLabel?: string;
  /** Blocks and breaks; omitted in the Open rhythm. */
  track?: FocusTrackSegment[];
  /** "Start block 3", shown while the phase is confirm. */
  confirmLabel?: string;
  onConfirm?: () => void;
  /** e.g. "Planned end 12:36 · 3 h max" or "Planned end 15:55 · before the 16:00 lecture". */
  plannedLine: ReactNode;
  visibility: FocusVisibility;
  showName: boolean;
  signedIn: boolean;
  text: FocusSurfaceText;
  onVisibility?: (v: FocusVisibility) => void;
  onShowName?: (on: boolean) => void;
  onEnd?: () => void;
  /** Omit to hide Set Up (no focus service in this build). */
  onSetup?: () => void;
  style?: CSSProperties;
}

function Track({ segments }: { segments: FocusTrackSegment[] }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: 3, alignItems: 'center', height: 8 }}>
      {segments.map((seg, i) => {
        const fill = seg.state === 'done' ? 1 : seg.state === 'now' ? Math.min(1, Math.max(0, seg.progress ?? 0)) : 0;
        const tall = seg.kind === 'focus';
        return (
          <span
            key={i}
            style={{
              flex: `${seg.minutes} 1 0`,
              minWidth: 4,
              height: tall ? 8 : 4,
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              background: 'var(--focus-state-layer)',
              outline: seg.state === 'now' ? '1px solid var(--md-on-focus-container)' : 'none',
              outlineOffset: 1,
            }}
          >
            <span
              style={{
                display: 'block',
                width: `${fill * 100}%`,
                height: '100%',
                background: tall ? 'var(--md-on-focus-container)' : 'var(--md-focus)',
                opacity: tall ? 1 : 0.6,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

export function FocusSurface({
  elapsed,
  elapsedLabel,
  phase = 'focus',
  phaseLabel,
  track,
  confirmLabel,
  onConfirm,
  plannedLine,
  visibility,
  showName,
  signedIn,
  text,
  onVisibility,
  onShowName,
  onEnd,
  onSetup,
  style = {},
}: FocusSurfaceProps) {
  const onFocusText: CSSProperties = { color: 'var(--md-on-focus-container)' };
  return (
    <section
      aria-label={text.title}
      style={{
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
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
        {phase === 'focus' ? <IconTimer size={18} /> : <IconBreak size={18} />}
        <span style={{ flex: 1, minWidth: 0 }}>{text.title}</span>
        {phaseLabel && <span style={{ fontWeight: 400, fontSize: 13 }}>{phaseLabel}</span>}
      </div>
      {phase === 'confirm' && confirmLabel && (
        <Button
          variant="filled"
          onClick={onConfirm}
          style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', alignSelf: 'stretch' }}
        >
          {confirmLabel}
        </Button>
      )}
      <div>
        <div
          role="timer"
          aria-label={elapsedLabel}
          style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: phase === 'confirm' ? 32 : 48,
            fontWeight: 300,
            lineHeight: 1,
          }}
        >
          {elapsed}
        </div>
        {track && track.length > 1 && (
          <div style={{ marginTop: 12 }}>
            <Track segments={track} />
          </div>
        )}
        <div style={{ fontSize: 13, marginTop: 8 }}>{plannedLine}</div>
      </div>

      {signedIn ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SegmentedControl<FocusVisibility>
            tone="focus"
            label={text.visibility}
            value={visibility}
            onChange={onVisibility}
            options={[
              { id: 'private', label: text.private, icon: <IconLock size={16} /> },
              { id: 'public', label: text.public, icon: <IconGroup size={16} /> },
            ]}
          />
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, textWrap: 'pretty' }}>
            {visibility === 'private' ? text.explainPrivate : text.explainPublic}
          </p>
          {visibility === 'public' && (
            <Switch tone="focus" checked={showName} onChange={onShowName} label={text.showName} sub={text.nameSub} />
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 12,
            borderRadius: 'var(--radius-m)',
            background: 'var(--focus-state-layer)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.45 }}>
            <span style={{ marginTop: 1 }}>
              <IconPhone size={16} />
            </span>
            <span style={{ textWrap: 'pretty' }}>{text.signedOut}</span>
          </div>
          {onSetup && (
            <div style={{ marginLeft: -12 }}>
              <Button variant="text" size="small" onClick={onSetup} style={onFocusText}>
                {text.setup}
              </Button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.4, textWrap: 'pretty' }}>{text.lockedNote}</span>
        <Button
          variant="outlined"
          onClick={onEnd}
          style={{ ...onFocusText, borderColor: 'var(--md-on-focus-container)', flexShrink: 0 }}
        >
          {text.end}
        </Button>
      </div>
    </section>
  );
}
