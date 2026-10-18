import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { Skeleton } from '../core/Skeleton';
import { IconShare } from './focusIcons';
import { focusCalendar, focusGridMove } from '../../domain/focusGraph';
import type { FocusCell, FocusDay } from '../../domain/focusGraph';

export type { FocusDay } from '../../domain/focusGraph';

export interface FocusGraphText {
  days: string[];
  months: string[];
  cellLabel: (date: Date, minutes: number) => string;
  less: string;
  more: string;
  closed: string;
  rest?: string;
  share: string;
  shareLabel?: string;
  tableCaption: string;
  weekOf: string;
  weekLabel: (weekStart: Date) => string;
  keyboardHint?: string;
  loading?: string;
}
export interface FocusGraphProps {
  days: FocusDay[];
  today: string;
  weeks?: number;
  /** Retained for existing design specimens; CSS uses the card's actual width. */
  compact?: boolean;
  stats: ReactNode;
  secondaryStats?: ReactNode;
  status?: ReactNode;
  loading?: boolean;
  label: string;
  text: FocusGraphText;
  onShare?: () => void;
  style?: CSSProperties;
}

/** Quiet year overview: native swiping, direct day selection and one keyboard stop. */
export function FocusGraph({ days, today, weeks = 53, stats, secondaryStats, status,
  label, text, onShare, loading = false, style }: FocusGraphProps) {
  const hintId = useId();
  const columns = useMemo(() => focusCalendar(days, today, weeks), [days, today, weeks]);
  const cells = useMemo(() => columns.flatMap(column => column.cells), [columns]);
  const lastIndex = cells.findIndex(cell => cell.today);
  const [selection, setSelection] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const selected = cells.find(cell => cell.date === selection && !cell.future) ?? cells[lastIndex];
  const detail = cells.find(cell => cell.date === hover) ?? selected;
  const scroller = useRef<HTMLDivElement>(null);
  const viewPosition = useRef(1);

  const cellLabel = (cell: FocusCell) => `${text.cellLabel(cell.dateValue, cell.minutes)}${
    cell.closed ? ` · ${text.closed}` : cell.rest ? ` · ${text.rest ?? text.closed}` : ''}`;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    viewPosition.current = 1;
    if (typeof ResizeObserver === 'undefined') return;
    let width = el.clientWidth;
    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.scrollLeft = viewPosition.current * Math.max(0, el.scrollWidth - el.clientWidth);
        setHover(null);
        frame = null;
      });
    });
    observer.observe(el);
    return () => { observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); };
  }, [today, weeks]);

  const reveal = (button: HTMLElement) => {
    const el = scroller.current;
    if (!el) return;
    const cell = button.getBoundingClientRect();
    const view = el.getBoundingClientRect();
    // Keep the sticky weekday labels clear; never scroll the outer page.
    const inset = (el.querySelector<HTMLElement>('.thd-focus-axis')?.getBoundingClientRect().width ?? 32) + 4;
    if (cell.left < view.left + inset) el.scrollLeft -= view.left + inset - cell.left;
    else if (cell.right > view.right - 4) el.scrollLeft += cell.right - view.right + 4;
  };
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.altKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = cells[focusGridMove(index, lastIndex, event.key, event.ctrlKey || event.metaKey)];
    const button = scroller.current?.querySelector<HTMLButtonElement>(`[data-date="${next.date}"]`);
    button?.focus({ preventScroll: true });
    if (button) reveal(button);
  };

  return (
    <section className="thd-focus-card" aria-label={label} aria-busy={loading || undefined} style={style}>
      {status && <div className="thd-focus-status">{status}</div>}
      <div className="thd-focus-summary">
        {loading ? <Skeleton label={text.loading ?? 'Loading study history'} blocks={[24, 16]} radius="var(--radius-xs)" gap={4} style={{ flex: 1, maxWidth: '14rem' }} /> : <p className={secondaryStats ? 'thd-focus-total' : 'thd-focus-empty'}>
          {stats}
          {secondaryStats && <span className="thd-focus-streak">{secondaryStats}</span>}
        </p>}
        {onShare && !loading && <button type="button" className="thd-focus-share" aria-label={text.share} onClick={onShare}><IconShare size={20} strokeWidth={1.9} /><span>{text.shareLabel ?? text.share}</span></button>}
      </div>
      <div className="thd-focus-graph-scroll" ref={scroller} onScroll={() => {
        const el = scroller.current;
        if (el && el.scrollWidth > el.clientWidth) viewPosition.current = el.scrollLeft / (el.scrollWidth - el.clientWidth);
        setHover(null);
      }}>
        <div className="thd-focus-grid" role="grid" aria-label={text.tableCaption}
          aria-rowcount={8} aria-colcount={weeks + 1} aria-describedby={text.keyboardHint ? hintId : undefined}
          style={{ '--focus-weeks': weeks } as CSSProperties}
          onPointerLeave={() => setHover(null)}>
          <div role="row" className="thd-focus-row">
            <span role="columnheader" className="thd-focus-axis thd-focus-month" style={{ gridRow: 1, gridColumn: 1 }} />
            {columns.map((column, col) => <span key={col} role="columnheader"
              className="thd-focus-month" aria-label={`${text.weekOf} ${text.weekLabel(column.weekStart)}`}
              style={{ gridRow: 1, gridColumn: col + 2 }}>{column.month === null ? '' : text.months[column.month]}</span>)}
          </div>
          {text.days.map((day, row) => (
            <div key={day} role="row" className="thd-focus-row">
              <span role="rowheader" aria-label={day} className="thd-focus-axis"
                style={{ gridRow: row + 2, gridColumn: 1 }}>{row % 2 === 0 && row < 5 ? day : ''}</span>
              {columns.map((column, col) => {
                const cell = column.cells[row];
                const position = { gridRow: row + 2, gridColumn: col + 2 };
                return cell.future
                  ? <span key={cell.date} role="gridcell" aria-disabled="true" className="thd-focus-future" style={position} />
                  : <button key={cell.date} type="button" role="gridcell" className="thd-focus-day"
                    data-date={cell.date} data-today={cell.today || undefined}
                    data-closed={cell.closed || undefined} data-rest={cell.rest && !cell.minutes || undefined}
                    data-selected={cell.date === selected.date && !cell.today || undefined}
                    disabled={loading} tabIndex={!loading && cell.date === selected.date ? 0 : -1} aria-selected={cell.date === selected.date} aria-current={cell.today ? 'date' : undefined}
                    aria-label={cellLabel(cell)}
                    style={{ ...position, background: `var(--md-graph-${cell.level})` }}
                    onKeyDown={event => navigate(event, col * 7 + row)}
                    onPointerEnter={event => { if (event.pointerType === 'mouse') setHover(cell.date); }}
                    onFocus={event => { setSelection(cell.date); setHover(null); reveal(event.currentTarget); }}
                    onClick={() => { setSelection(cell.date); setHover(null); }} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="thd-focus-legend">
        <div role="img" aria-label={`${text.less} → ${text.more}`} className="thd-focus-ramp">
          <span>{text.less}</span>
          <span className="thd-focus-swatches">{[0, 1, 2, 3, 4].map(level => <i key={level} style={{ background: `var(--md-graph-${level})` }} />)}</span>
          <span>{text.more}</span>
        </div>
        <span className="thd-focus-rest-key"><i className="thd-focus-day" data-rest="true" aria-hidden="true" />{text.rest ?? text.closed}</span>
      </div>
      <p className="thd-focus-detail" aria-live="polite" aria-atomic="true">{detail ? cellLabel(detail) : ''}</p>
      {text.keyboardHint && <p id={hintId} className="thd-visually-hidden">{text.keyboardHint}</p>}
    </section>
  );
}
