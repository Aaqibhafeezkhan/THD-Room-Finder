// Mirror of src/components/focus/ProfileHeader.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { Button } from '../core/Button.jsx';
import { IconButton } from '../core/IconButton.jsx';
import { IconGroup, IconPerson, IconSettings } from './focusIcons.jsx';

/**
 * The one-line top of Profile (D2): avatar initial, name and the violet batch
 * chip, then the gear. Signed out it reads "Not signed in" with Set Up Study
 * Profile; the gear stays so theme and language are always reachable.
 * Focus order: name → batch chip → Set Up → gear.
 */
const avatar = {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-full)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
};
export function ProfileHeader({ signedIn, name, batch, batchLabel, notSignedIn, setupLabel, settingsLabel, onSetup, onSettings, style = {}, }) {
    return (<div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-sans)', ...style }}>
      {signedIn ? (<>
          <span aria-hidden="true" style={{
                ...avatar,
                background: 'var(--md-primary-container)',
                color: 'var(--md-on-primary-container)',
                fontSize: 18,
                fontWeight: 500,
            }}>
            {(name ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 10px' }}>
            {name && <span style={{ fontSize: 'var(--title-large-size)', fontWeight: 400, color: 'var(--md-on-surface)', overflowWrap: 'anywhere' }}>{name}</span>}
            {batch && (<span aria-label={batchLabel} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 24,
                    padding: '0 8px',
                    borderRadius: 'var(--radius-s)',
                    background: 'var(--md-focus-container)',
                    color: 'var(--md-on-focus-container)',
                    fontSize: 'var(--label-small-size)',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                }}>
                <IconGroup size={14}/>
                {batch}
              </span>)}
          </div>
        </>) : (<>
          <span aria-hidden="true" style={{ ...avatar, background: 'var(--md-surface-variant)', color: 'var(--md-on-surface-variant)' }}>
            <IconPerson size={20}/>
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 4px' }}>
            <span style={{ fontSize: 'var(--body-large-size)', color: 'var(--md-on-surface-variant)', marginRight: 4 }}>
              {notSignedIn}
            </span>
            {onSetup && (<div style={{ marginLeft: -12, maxWidth: 'calc(100% + 12px)' }}>
                <Button variant="text" size="small" onClick={onSetup} style={{ whiteSpace: 'normal', textAlign: 'left', maxWidth: '100%' }}>
                  {setupLabel}
                </Button>
              </div>)}
          </div>
        </>)}
      <IconButton label={settingsLabel} onClick={onSettings}>
        <IconSettings size={22} strokeWidth={1.9}/>
      </IconButton>
    </div>);
}
