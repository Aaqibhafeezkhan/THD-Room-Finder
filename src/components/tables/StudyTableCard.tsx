import type { CSSProperties, ReactNode } from 'react';

/**
 * The table page's main card (M2): the seat ring, then the topic and three
 * short lines (when, where, who). On phones the ring sits on top; on wide
 * windows it sits left of the details, and the actions move into the card.
 */
export interface StudyTableCardProps {
  ring: ReactNode;
  topic: string;
  when: ReactNode;
  where: ReactNode;
  who?: ReactNode;
  /** One TableTag above the topic. */
  tag?: ReactNode;
  /** Ring beside the details instead of above them. */
  wide?: boolean;
  /** Muted topic, for cancelled or ended tables. */
  muted?: boolean;
  /** Actions; inside the card next to the details on wide windows. */
  children?: ReactNode;
  style?: CSSProperties;
}

export function StudyTableCard({ ring, topic, when, where, who, tag, wide = false, muted = false, children, style = {} }: StudyTableCardProps) {
  const details = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      {tag}
      <h2
        style={{
          margin: 0,
          fontSize: wide ? 'var(--headline-size)' : 'var(--title-large-size)',
          fontWeight: 500,
          lineHeight: 1.25,
          color: muted ? 'var(--md-on-surface-variant)' : 'var(--md-on-surface)',
          overflowWrap: 'anywhere',
        }}
      >
        {topic}
      </h2>
      <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--md-on-surface-variant)', fontSize: 'var(--body-medium-size)' }}>
        <span style={{ display: 'block', color: 'var(--md-on-surface)', fontWeight: 500 }}>{when}</span>
        <span style={{ display: 'block' }}>{where}</span>
        {who && <span style={{ display: 'block' }}>{who}</span>}
      </p>
      {wide && children}
    </div>
  );
  return (
    <section
      style={{
        background: 'var(--md-surface)',
        borderRadius: 'var(--radius-l)',
        boxShadow: 'var(--md-shadow-1)',
        padding: wide ? 28 : 16,
        display: wide ? 'grid' : 'flex',
        gridTemplateColumns: wide ? 'auto minmax(0, 1fr)' : undefined,
        flexDirection: 'column',
        alignItems: wide ? 'center' : 'stretch',
        gap: wide ? 32 : 12,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>{ring}</div>
      {details}
    </section>
  );
}
