import React from 'react';

export interface AppBarProps {
  /** brand = logo + wordmark; back = back arrow + page title. */
  mode?: 'brand' | 'back';
  /** Wordmark (brand mode) or page title (back mode). */
  title?: string;
  /** Back handler (back mode). */
  onBack?: () => void;
  /** Trailing action nodes, e.g. an IconButton sponsor heart. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Material 3 top app bar used on every screen of THD Room Finder.
 * @startingPoint section="Room Finder" subtitle="M3 top app bar (brand / back)" viewport="700x80"
 */
export function AppBar(props: AppBarProps): JSX.Element;
