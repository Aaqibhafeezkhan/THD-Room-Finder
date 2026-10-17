import type { CSSProperties } from 'react';
import { Button } from '../core/Button';
import { IconButton } from '../core/IconButton';
import { IconGroup, IconPerson, IconSettings } from './focusIcons';

/**
 * The one-line top of Profile (D2): avatar initial, name and the violet batch
 * chip, then the gear. Signed out it reads "Not signed in" with Set Up Study
 * Profile; the gear stays so theme and language are always reachable.
 * Focus order: name → batch chip → Set Up → gear.
 */
export interface ProfileHeaderProps {
  signedIn: boolean;
  /** Display name, or the programme when none is set. */
  name?: string;
  /** "AIN 7" */
  batch?: string;
  /** "Batch AIN 7" */
  batchLabel?: string;
  /** "Not signed in" */
  notSignedIn: string;
  /** "Set Up Study Profile" */
  setupLabel: string;
  /** "Settings" */
  settingsLabel: string;
  /** Omit when study profiles aren't available; Set Up is then hidden. */
  onSetup?: () => void;
  onSettings?: () => void;
  style?: CSSProperties;
}

const avatar: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-full)',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

export function ProfileHeader({
  signedIn,
  name,
  batch,
  batchLabel,
  notSignedIn,
  setupLabel,
  settingsLabel,
  onSetup,
  onSettings,
  style = {},
}: ProfileHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-sans)', ...style }}>
      {signedIn ? (
        <>
          <span
            aria-hidden="true"
            style={{
              ...avatar,
              background: 'var(--md-primary-container)',
              color: 'var(--md-on-primary-container)',
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            {(name ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 10px' }}>
            {name && <span style={{ fontSize: 20, fontWeight: 400, color: 'var(--md-on-surface)' }}>{name}</span>}
            {batch && (
              <span
                aria-label={batchLabel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  height: 24,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-s)',
                  background: 'var(--md-focus-container)',
                  color: 'var(--md-on-focus-container)',
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                <IconGroup size={14} />
                {batch}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <span aria-hidden="true" style={{ ...avatar, background: 'var(--md-surface-variant)', color: 'var(--md-on-surface-variant)' }}>
            <IconPerson size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 4px' }}>
            <span style={{ fontSize: 16, color: 'var(--md-on-surface-variant)', marginRight: 4, whiteSpace: 'nowrap' }}>
              {notSignedIn}
            </span>
            {onSetup && (
              <div style={{ marginLeft: -12 }}>
                <Button variant="text" size="small" onClick={onSetup}>
                  {setupLabel}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      <IconButton label={settingsLabel} onClick={onSettings}>
        <IconSettings size={22} strokeWidth={1.9} />
      </IconButton>
    </div>
  );
}
