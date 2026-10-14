import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../core/Button';
import { SegmentedControl } from '../core/SegmentedControl';
import { Switch } from '../core/Switch';
import { IconGroup, IconLock, IconPhone, IconTimer } from './focusIcons';

/**
 * The running session on room detail (D1): a violet focus-container card with
 * the timer, the planned end and why, Private | Public (Private is the
 * default), one plain line on what others see, "Show my name" in Public only,
 * the lock-screen note and End. Signed out it is a local timer: no visibility
 * control, a line saying the room is not claimed, and Set Up Study Profile.
 * Focus order: timer → visibility → name → End.
 */
export type FocusVisibility = 'private' | 'public';

export interface FocusSurfaceText {
  /** "Focus session" */
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
  /** "Keeps running when your phone is locked. We check in about once an hour." */
  lockedNote: string;
  /** "End" */
  end: string;
  /** Signed out: "Only you see this timer; the room doesn't show as claimed. …" */
  signedOut: string;
  /** "Set Up Study Profile" */
  setup: string;
}

export interface FocusSurfaceProps {
  /** Elapsed time, e.g. "24:10". */
  elapsed: string;
  /** Full-sentence timer label, e.g. "24 minutes 10 seconds focused". */
  elapsedLabel?: string;
  /** e.g. "Planned end 12:36 · 3 h max" or "Planned end 15:55 · before the 16:00 lecture". */
  plannedLine: ReactNode;
  visibility: FocusVisibility;
  showName: boolean;
  signedIn: boolean;
  text: FocusSurfaceText;
  onVisibility?: (v: FocusVisibility) => void;
  onShowName?: (on: boolean) => void;
  onEnd?: () => void;
  onSetup?: () => void;
  style?: CSSProperties;
}

export function FocusSurface({
  elapsed,
  elapsedLabel,
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
        <IconTimer size={18} />
        <span>{text.title}</span>
      </div>
      <div>
        <div
          role="timer"
          aria-label={elapsedLabel}
          style={{
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 48,
            fontWeight: 300,
            lineHeight: 1,
          }}
        >
          {elapsed}
        </div>
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
          <div style={{ marginLeft: -12 }}>
            <Button variant="text" size="small" onClick={onSetup} style={onFocusText}>
              {text.setup}
            </Button>
          </div>
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
