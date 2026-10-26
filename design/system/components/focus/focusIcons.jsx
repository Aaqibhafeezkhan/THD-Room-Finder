// Mirror of src/components/focus/focusIcons.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React from 'react';

/**
 * Line icons used by the focus layer (D1–D4) — 24×24 Lucide shapes, stroke
 * currentColor, so they take the colour of the surface they sit on. Kept next
 * to the focus components so the design-system mirror stays self-contained.
 */
function icon(children) {
    return function Icon({ size = 18, strokeWidth = 2 }) {
        return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
        {children}
      </svg>);
    };
}
/** Stopwatch: your own session (focus surface, pill, own badge). */
export const IconTimer = icon(<>
    <line x1="10" x2="14" y1="2" y2="2"/>
    <line x1="12" x2="15" y1="14" y2="11"/>
    <circle cx="12" cy="14" r="8"/>
  </>);
/** Group: your batch (public sessions, batch chip). */
export const IconGroup = icon(<>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </>);
/** Single person: someone else's claim, signed-out avatar. */
export const IconPerson = icon(<>
    <circle cx="12" cy="8" r="5"/>
    <path d="M20 21a8 8 0 0 0-16 0"/>
  </>);
/** Padlock: Private, and the "private by default" note. */
export const IconLock = icon(<>
    <rect width="18" height="11" x="3" y="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </>);
/** Crossed-out Wi-Fi: offline, activity unknown. */
export const IconOffline = icon(<>
    <path d="M12 20h.01"/>
    <path d="M8.5 16.43a5 5 0 0 1 7 0"/>
    <path d="M5 12.86a10 10 0 0 1 5.17-2.69"/>
    <path d="M19 12.86a10 10 0 0 0-2-1.52"/>
    <path d="M2 8.82a15 15 0 0 1 4.18-2.64"/>
    <path d="M22 8.82a15 15 0 0 0-11.29-3.76"/>
    <path d="m2 2 20 20"/>
  </>);
/** Circled i: neutral notes (lecture now, time travel, quiet). */
export const IconInfo = icon(<>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </>);
/** Circled check: session ended, compact free status. */
export const IconCheckCircle = icon(<>
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </>);
/** Phone: the signed-out local timer. */
export const IconPhone = icon(<>
    <rect width="14" height="20" x="5" y="2" rx="2"/>
    <path d="M12 18h.01"/>
  </>);
/** Share: the focus graph's share action. */
export const IconShare = icon(<>
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
  </>);
/** Gear: Settings, from the Profile header. */
export const IconSettings = icon(<>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </>);
/** Cup: a break between focus blocks (focus surface, pill). */
export const IconBreak = icon(<>
    <path d="M10 2v2"/>
    <path d="M14 2v2"/>
    <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>
    <path d="M6 2v2"/>
  </>);
/** House: a session at home (ADR 0011). */
export const IconHome = icon(<>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </>);
/** Columned building: a campus room, the On campus card. */
export const IconCampus = icon(<>
    <path d="M10 18v-7"/>
    <path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/>
    <path d="M14 18v-7"/>
    <path d="M18 18v-7"/>
    <path d="M3 22h18"/>
    <path d="M6 18v-7"/>
  </>);
