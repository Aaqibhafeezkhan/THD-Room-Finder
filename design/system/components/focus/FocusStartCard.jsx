// Mirror of src/components/focus/FocusStartCard.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';
import { Button } from '../core/Button.jsx';
import { FocusButton } from './FocusButton.jsx';
import { IconCampus, IconHome } from './focusIcons.jsx';

/**
 * The two places on the Focus tab (ADR 0011). `FocusStartCard` starts focus
 * at home: a violet house well, one line on what it means, the Start focus
 * button and one row per choice for this session (rhythm, sounds), each with
 * Change. `OnCampusCard` leads to the room finder: a teal building well and
 * the live state of the campus. Violet stays "your focus", teal "free on
 * campus", so the two places read at a glance without new colours.
 */
const card = {
    background: 'var(--md-surface)',
    borderRadius: 'var(--radius-l)',
    boxShadow: 'var(--md-shadow-1)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontFamily: 'var(--font-sans)',
    color: 'var(--md-on-surface)',
};
function Well({ tone, children }) {
    const focus = tone === 'focus';
    return (<span aria-hidden="true" style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            background: focus ? 'var(--md-focus-container)' : 'var(--md-tertiary-container)',
            color: focus ? 'var(--md-on-focus-container)' : 'var(--md-on-tertiary-container)',
        }}>
      {children}
    </span>);
}
function Heading({ title, line }) {
    return (<div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 'var(--title-medium-size)', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)', textWrap: 'pretty' }}>{line}</div>
    </div>);
}
export function FocusStartCard({ title, line, startLabel, onStart, choices = [], style = {} }) {
    return (<section aria-label={title} style={{ ...card, ...style }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Well tone="focus">
          <IconHome size={20}/>
        </Well>
        <Heading title={title} line={line}/>
      </div>
      <FocusButton tone="start" fullWidth onClick={onStart}>
        {startLabel}
      </FocusButton>
      {choices.length > 0 && (<div>
          {choices.map((c) => (<div key={c.strong + (c.rest ?? '')} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
              <span style={{ display: 'inline-flex', color: 'var(--md-on-surface-variant)' }}>{c.icon}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>
                <strong style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>{c.strong}</strong>
                {c.rest ? ` · ${c.rest}` : ''}
              </span>
              <Button variant="text" size="small" onClick={c.onChange}>
                {c.changeLabel}
              </Button>
            </div>))}
        </div>)}
    </section>);
}
export function OnCampusCard({ title, line, actionLabel, onAction, style = {} }) {
    return (<section aria-label={title} style={{ ...card, ...style }}>
      {/* The action moves under the line when the card is narrow. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: '1 1 180px', minWidth: 0 }}>
          <Well tone="free">
            <IconCampus size={20}/>
          </Well>
          <Heading title={title} line={line}/>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="text" size="small" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </section>);
}
