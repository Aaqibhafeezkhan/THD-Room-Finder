/**
 * Line icons used by the focus layer (D1–D4) — 24×24 Lucide shapes, stroke
 * currentColor, so they take the colour of the surface they sit on. Kept next
 * to the focus components so the design-system mirror stays self-contained.
 */
export interface FocusIconProps {
    size?: number;
    strokeWidth?: number;
}
/** Stopwatch: your own session (focus surface, pill, own badge). */
export declare const IconTimer: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Group: your batch (public sessions, batch chip). */
export declare const IconGroup: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Single person: someone else's claim, signed-out avatar. */
export declare const IconPerson: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Padlock: Private, and the "private by default" note. */
export declare const IconLock: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Crossed-out Wi-Fi: offline, activity unknown. */
export declare const IconOffline: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Circled i: neutral notes (lecture now, time travel, quiet). */
export declare const IconInfo: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Circled check: session ended, compact free status. */
export declare const IconCheckCircle: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Phone: the signed-out local timer. */
export declare const IconPhone: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Share: the focus graph's share action. */
export declare const IconShare: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Gear: Settings, from the Profile header. */
export declare const IconSettings: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
/** Cup: a break between focus blocks (focus surface, pill). */
export declare const IconBreak: ({ size, strokeWidth }: FocusIconProps) => JSX.Element;
