import React from 'react';

export interface NavItem {
  /** Stable id passed back through onSelect. */
  id: string;
  /** Visible label — caller supplies it, so EN/DE both work. */
  label: string;
  /** Inline SVG icon node (Feather/Lucide, 24×24, stroke currentColor). */
  icon: React.ReactNode;
  /** Optional notification count rendered as an error-red badge. */
  badge?: number;
}

export interface AdaptiveNavProps {
  items: NavItem[];
  /** id of the active destination. */
  active?: string;
  onSelect?: (id: string) => void;
  /**
   * Which form to render. 'auto' (default) tracks window width through the
   * Material window size classes: compact→bar, medium→rail, expanded→drawer.
   * Force a specific form for specimens / forced-breakpoint previews.
   */
  variant?: 'auto' | 'bar' | 'rail' | 'drawer';
  /** Wordmark shown in the drawer header. */
  title?: string;
  /** Extra node above the items (rail/drawer) — e.g. a primary action. */
  header?: React.ReactNode;
  /** Extra node pinned to the bottom (rail/drawer) — e.g. settings/avatar. */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Material 3 adaptive navigation — one component that becomes a bottom bar
 * (phone), a navigation rail (tablet), or a navigation drawer/sidebar
 * (desktop) based on the window size class.
 * @startingPoint section="App" subtitle="Bottom bar → rail → drawer, by window size class" viewport="900x420"
 */
export function AdaptiveNav(props: AdaptiveNavProps): JSX.Element;
