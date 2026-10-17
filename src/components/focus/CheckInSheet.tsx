import { Button } from '../core/Button';
import { Sheet } from '../core/Sheet';
import { IconTimer } from './focusIcons';

/**
 * "Still focusing in E 212?" (D1). Asked about once an hour so rooms don't stay
 * claimed after you leave; with no answer the session ends when the lease runs
 * out. Bottom sheet on phones, dialog on larger windows. Keep Going is the
 * main action and takes initial focus.
 */
export interface CheckInSheetProps {
  open: boolean;
  /** "Still focusing in E 212?" */
  title: string;
  /** "24:10 · E 212" */
  meta: string;
  /** "We ask about once an hour so rooms don't stay claimed after you leave. …" */
  body: string;
  endLabel: string;
  keepLabel: string;
  onKeep?: () => void;
  onEnd?: () => void;
  variant?: 'sheet' | 'dialog';
  contained?: boolean;
}

export function CheckInSheet({
  open,
  title,
  meta,
  body,
  endLabel,
  keepLabel,
  onKeep,
  onEnd,
  variant = 'sheet',
  contained,
}: CheckInSheetProps) {
  return (
    <Sheet open={open} onClose={onKeep} label={title} variant={variant} width={400} contained={contained}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            background: 'var(--md-focus-container)',
            color: 'var(--md-on-focus-container)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <IconTimer size={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.25 }}>{title}</div>
          <div
            style={{
              font: '400 13px var(--font-mono)',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--md-on-surface-variant)',
              marginTop: 2,
            }}
          >
            {meta}
          </div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--md-on-surface-variant)', textWrap: 'pretty' }}>
        {body}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <Button variant="text" onClick={onEnd}>
          {endLabel}
        </Button>
        <Button variant="filled" onClick={onKeep} data-autofocus="">
          {keepLabel}
        </Button>
      </div>
    </Sheet>
  );
}
