import type { CSSProperties } from 'react';

/**
 * Static loading placeholder (D2, D3): flat blocks in surface-variant, no
 * shimmer, so nothing moves for reduced-motion users or anyone else. The
 * wrapper is aria-busy and carries a visually hidden status line such as
 * "Checking rooms…".
 */
export interface SkeletonProps {
  /** Announced once to screen readers, e.g. "Loading E 212…". */
  label: string;
  /** Height of each block in px, top to bottom. */
  blocks?: number[];
  /** Corner radius of the blocks; cards use radius-l. */
  radius?: string;
  gap?: number;
  style?: CSSProperties;
}

const hidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

export function Skeleton({ label, blocks = [72, 72, 72], radius = 'var(--radius-l)', gap = 8, style = {} }: SkeletonProps) {
  return (
    <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      <span role="status" style={hidden}>
        {label}
      </span>
      {blocks.map((h, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{ height: h, borderRadius: radius, background: 'var(--md-surface-variant)', opacity: 0.6 }}
        />
      ))}
    </div>
  );
}
