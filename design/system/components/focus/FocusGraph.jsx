// Mirror of src/components/focus/FocusGraph.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React, { useEffect, useRef, useState } from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { IconShare } from './focusIcons.jsx';
import { isCampusClosedDay, isFocusRestDay } from '../../domain/openingHours.jsx';

/**
 * The Profile hero (D2): a contribution graph of focus minutes. Square cells,
 * seven rows Sun → Sat, one column per week, the current week rightmost, today
 * outlined, days after today left as empty slots. Five levels from the
 * --md-graph-0…4 ramp (it follows the student's graph colour via data-accent).
 * A compact graph follows the card width; older history is available by
 * native scrolling, with the current week shown initially. The grid itself is hidden from
 * screen readers: the section label carries the stats and a visually hidden
 * table lists every day's minutes. Hover or tap a cell for its day.
 */
/** One Pomodoro block, the default rhythm's unit of focus (ADR 0004). */
const BLOCK_MINUTES = 25;
/**
 * Daily minutes → ramp level, counted in whole Pomodoro blocks: 0 · 1 ·
 * 2–3 · 4–6 · 7+ (0 · <50 · <100 · <175 · 175+ min). Any focus at all is
 * level 1. Fixed, not relative to the best day, so cards compare.
 */
export function focusLevel(minutes) {
    if (minutes <= 0)
        return 0;
    const blocks = Math.floor(minutes / BLOCK_MINUTES);
    if (blocks < 2)
        return 1;
    if (blocks < 4)
        return 2;
    if (blocks < 7)
        return 3;
    return 4;
}
export function parseDay(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}
export function dayKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
/** Sunday of the week that contains d. */
export function sundayOf(d) {
    return addDays(d, -d.getDay());
}
const hidden = {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
};
export function FocusGraph({ days, today, weeks = 53, compact: _compact = false, stats, secondaryStats, status, label, text, onShare, style = {}, }) {
    const [tip, setTip] = useState(null);
    const scroller = useRef(null);
    useEffect(() => {
        const el = scroller.current;
        if (!el)
            return;
        el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
        if (typeof ResizeObserver === 'undefined')
            return;
        let previousWidth = el.clientWidth;
        let frame = null;
        let previousMax = Math.max(0, el.scrollWidth - el.clientWidth);
        const observer = new ResizeObserver(() => {
            if (el.clientWidth === previousWidth)
                return;
            previousWidth = el.clientWidth;
            if (frame !== null)
                cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const ratio = previousMax > 0 ? el.scrollLeft / previousMax : 1;
                previousMax = Math.max(0, el.scrollWidth - el.clientWidth);
                el.scrollLeft = ratio * previousMax;
                setTip(null);
                frame = null;
            });
        });
        observer.observe(el);
        return () => { observer.disconnect(); if (frame !== null)
            cancelAnimationFrame(frame); };
    }, [today, weeks]);
    const minutesByDay = new Map();
    for (const d of days)
        minutesByDay.set(d.date, (minutesByDay.get(d.date) ?? 0) + d.minutes);
    const todayDate = parseDay(today);
    const firstSunday = addDays(sundayOf(todayDate), -(weeks - 1) * 7);
    const columns = [];
    for (let w = 0; w < weeks; w++) {
        const sunday = addDays(firstSunday, w * 7);
        const prev = addDays(sunday, -7);
        let month = sunday.getMonth() !== prev.getMonth() ? text.months[sunday.getMonth()] : '';
        if (w === 0) {
            const sameAhead = addDays(sunday, 7).getMonth() === sunday.getMonth() && addDays(sunday, 14).getMonth() === sunday.getMonth();
            month = sameAhead ? text.months[sunday.getMonth()] : '';
        }
        const cells = [];
        for (let d = 0; d < 7; d++) {
            const date = addDays(sunday, d);
            const key = dayKey(date);
            cells.push({ key, date, minutes: minutesByDay.get(key) ?? 0, future: date > todayDate, today: key === today });
        }
        columns.push({ sunday, month, cells });
    }
    const items = [<div key="corner" style={{ position: 'sticky', left: 0, zIndex: 1, minWidth: 32, background: 'var(--md-surface)' }}/>];
    text.days.forEach((d, i) => items.push(<div key={`day${i}`} style={{ position: 'sticky', left: 0, zIndex: 1, alignSelf: 'stretch', minWidth: 32, background: 'var(--md-surface)' }}>
        <span style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 12,
            lineHeight: 1,
            color: 'var(--md-on-surface-variant)',
            whiteSpace: 'nowrap',
        }}>
          {i % 2 === 1 && i < 6 ? d : ''}
        </span>
      </div>));
    columns.forEach((col, c) => {
        items.push(<div key={`m${c}`} data-week={c} style={{ height: 16, fontSize: 12, lineHeight: '14px', color: 'var(--md-on-surface-variant)', whiteSpace: 'nowrap' }}>
        {col.month}
      </div>);
        col.cells.forEach((cell) => {
            if (cell.future) {
                items.push(<div key={cell.key} style={{ width: '100%', aspectRatio: '1', alignSelf: 'start' }}/>);
                return;
            }
            const closed = isCampusClosedDay(cell.date);
            const cellText = `${text.cellLabel(cell.date, cell.minutes)}${closed ? ` · ${text.closed}` : isFocusRestDay(cell.date) ? ` · ${text.rest ?? text.closed}` : ''}`;
            const show = () => {
                setTip({ key: cell.key, text: cellText });
            };
            items.push(<div key={cell.key} data-date={cell.key} data-closed={closed || undefined} data-rest={isFocusRestDay(cell.date) && cell.minutes === 0 || undefined} className="thd-focus-day" title={cellText} onMouseEnter={show} onMouseLeave={() => setTip(null)} onClick={() => (tip?.key === cell.key ? setTip(null) : show())} style={{
                    width: '100%',
                    aspectRatio: '1',
                    alignSelf: 'start',
                    borderRadius: 3,
                    background: `var(--md-graph-${focusLevel(cell.minutes)})`,
                    outline: cell.today ? '1.5px solid var(--md-on-surface)' : 'none',
                    outlineOffset: 1,
                }}/>);
        });
    });
    const legendCell = { width: 9, height: 9, borderRadius: 2, display: 'inline-block' };
    const currentDay = columns[columns.length - 1]?.cells.find(cell => cell.today);
    const currentDetail = currentDay
        ? `${text.cellLabel(currentDay.date, currentDay.minutes)}${isCampusClosedDay(currentDay.date) ? ` · ${text.closed}` : isFocusRestDay(currentDay.date) ? ` · ${text.rest ?? text.closed}` : ''}`
        : '';
    return (<section className="thd-focus-card" aria-label={label} style={{
            background: 'var(--md-surface)',
            borderRadius: 'var(--radius-l)',
            boxShadow: 'var(--md-shadow-1)',
            padding: 'var(--space-5)',
            containerType: 'inline-size',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            minWidth: 0,
            position: 'relative',
            fontFamily: 'var(--font-sans)',
            ...style,
        }}>
      {status && <div className="thd-focus-status" role="status">{status}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{
            margin: 0,
            flex: 1,
            minWidth: 0,
            fontSize: secondaryStats ? 'var(--title-large-size)' : 'var(--body-medium-size)',
            fontWeight: 400,
            lineHeight: 1.4,
            color: secondaryStats ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
            textWrap: 'pretty',
        }}>
          {stats}
          {secondaryStats && <span style={{ display: 'block', marginTop: 4, fontSize: 'var(--body-small-size)', fontWeight: 400, color: 'var(--md-on-surface-variant)' }}>{secondaryStats}</span>}
        </p>
        {onShare && (<IconButton label={text.share} onClick={onShare}>
            <IconShare size={20} strokeWidth={1.9}/>
          </IconButton>)}
      </div>
      <div style={{ position: 'relative', minWidth: 0 }}>
      <div className="thd-focus-graph-scroll" ref={scroller} onScroll={() => setTip(null)} tabIndex={0} role="region" aria-label={text.tableCaption} style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
            padding: '3px 3px 6px 0',
        }}>
        <div className="thd-focus-grid" aria-hidden="true" style={{
            direction: 'ltr',
            position: 'relative',
            display: 'grid',
            gridAutoFlow: 'column',
            gridTemplateRows: 'auto repeat(7, auto)',
            gridTemplateColumns: `32px repeat(${weeks}, var(--focus-cell))`,
            gap: 3,
            width: 'max-content',
        }}>
          {items}
        </div>
      </div>
      </div>
      <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px 20px',
            fontSize: 12,
            color: 'var(--md-on-surface-variant)',
        }}>
        <div role="img" aria-label={`${text.less} → ${text.more}`} style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
        <span>{text.less}</span>
        {[0, 1, 2, 3, 4].map((l) => (<i key={l} style={{ ...legendCell, background: `var(--md-graph-${l})` }}/>))}
        <span>{text.more}</span></div>
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><i className="thd-focus-day" data-rest="true" style={{ ...legendCell, background: 'var(--md-graph-0)' }}/>{text.rest ?? text.closed}</span>
      </div>
      <p className="thd-focus-detail" aria-live="polite">{tip?.text ?? currentDetail}</p>
      <div style={hidden}>
        <table>
          <caption>{text.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{text.weekOf}</th>
              {text.days.map((d) => (<th key={d} scope="col">
                  {d}
                </th>))}
            </tr>
          </thead>
          <tbody>
            {[...columns].reverse().map((col) => (<tr key={dayKey(col.sunday)}>
                <th scope="row">{text.weekLabel(col.sunday)}</th>
                {col.cells.map((cell) => (<td key={cell.key}>{cell.future ? '—' : `${cell.minutes}${isCampusClosedDay(cell.date) ? ` · ${text.closed}` : isFocusRestDay(cell.date) ? ` · ${text.rest ?? text.closed}` : ''}`}</td>))}
              </tr>))}
          </tbody>
        </table>
      </div>
    </section>);
}
