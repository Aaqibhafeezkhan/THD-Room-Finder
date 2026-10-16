// Mirror of src/components/focus/FocusGraph.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React, { useState } from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { IconShare } from './focusIcons.jsx';
import { isCampusClosedDay } from '../../domain/openingHours.jsx';

/**
 * The Profile hero (D2): a contribution graph of focus minutes. Square cells,
 * seven rows Sun → Sat, one column per week, the current week rightmost, today
 * outlined, days after today left as empty slots. Five levels from the
 * --md-graph-0…4 ramp (it follows the student's graph colour via data-accent).
 * Phones get fixed 11 px cells in a scroller that opens at the right edge;
 * wider windows fit every week with fluid cells. The grid itself is hidden from
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
export function FocusGraph({ days, today, weeks = 53, compact = false, stats, secondaryStats, label, text, onShare, style = {}, }) {
    const [tip, setTip] = useState(null);
    const [olderAvailable, setOlderAvailable] = useState(false);
    const updateOverflow = (el) => {
        if (el)
            setOlderAvailable(el.scrollWidth - el.clientWidth + el.scrollLeft > 2);
    };
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
    const items = [<div key="corner" style={{ position: 'sticky', left: 0, zIndex: 1, minWidth: 26, background: 'var(--md-surface)' }}/>];
    text.days.forEach((d, i) => items.push(<div key={`day${i}`} style={{ position: 'sticky', left: 0, zIndex: 1, alignSelf: 'stretch', minWidth: 26, background: 'var(--md-surface)' }}>
        <span style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            lineHeight: 1,
            color: 'var(--md-on-surface-variant)',
            whiteSpace: 'nowrap',
        }}>
          {i % 2 === 1 && i < 6 ? d : ''}
        </span>
      </div>));
    columns.forEach((col, c) => {
        items.push(<div key={`m${c}`} style={{ height: 16, fontSize: 11, lineHeight: '14px', color: 'var(--md-on-surface-variant)', whiteSpace: 'nowrap' }}>
        {col.month}
      </div>);
        col.cells.forEach((cell, r) => {
            if (cell.future) {
                items.push(<div key={cell.key} style={{ width: '100%', aspectRatio: '1', alignSelf: 'start' }}/>);
                return;
            }
            const closed = isCampusClosedDay(cell.date);
            const cellText = `${text.cellLabel(cell.date, cell.minutes)}${closed ? ` · ${text.closed}` : ''}`;
            const show = () => setTip({ key: cell.key, text: cellText, row: r, col: c });
            items.push(<div key={cell.key} data-date={cell.key} data-closed={closed || undefined} title={cellText} onMouseEnter={show} onMouseLeave={() => setTip(null)} onClick={() => (tip?.key === cell.key ? setTip(null) : show())} style={{
                    width: '100%',
                    aspectRatio: '1',
                    alignSelf: 'start',
                    borderRadius: 2,
                    background: closed ? 'var(--md-graph-closed)' : `var(--md-graph-${focusLevel(cell.minutes)})`,
                    outline: cell.today ? '1.5px solid var(--md-on-surface)' : 'none',
                    outlineOffset: 1,
                }}/>);
        });
    });
    const tipBelow = tip ? tip.row < 3 : true;
    const legendCell = { width: 11, height: 11, borderRadius: 2, display: 'inline-block' };
    return (<section aria-label={label} style={{
            background: 'var(--md-surface)',
            borderRadius: 'var(--radius-l)',
            boxShadow: 'var(--md-shadow-1)',
            padding: compact ? 16 : 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            minWidth: 0,
            position: 'relative',
            fontFamily: 'var(--font-sans)',
            ...style,
        }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
        <p style={{
            margin: 0,
            flex: 1,
            minWidth: 0,
            fontSize: secondaryStats ? 22 : 14,
            fontWeight: secondaryStats ? 500 : 400,
            lineHeight: 1.4,
            color: secondaryStats ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
            textWrap: 'pretty',
        }}>
          {stats}
          {secondaryStats && <span style={{ display: 'block', marginTop: 4, fontSize: 14, fontWeight: 400, color: 'var(--md-on-surface-variant)' }}>{secondaryStats}</span>}
        </p>
        {onShare && (<IconButton label={text.share} onClick={onShare}>
            <IconShare size={20} strokeWidth={1.9}/>
          </IconButton>)}
      </div>
      <div style={{ position: 'relative', minWidth: 0 }}>
      <div className="thd-focus-graph-scroll" ref={updateOverflow} onScroll={(event) => { updateOverflow(event.currentTarget); setTip(null); }} tabIndex={compact ? 0 : undefined} role={compact ? 'region' : undefined} aria-label={compact ? text.tableCaption : undefined} style={{
            direction: 'rtl',
            overflowX: compact ? 'auto' : 'hidden',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            padding: '3px 3px 6px 0',
        }}>
        <div aria-hidden="true" style={{
            direction: 'ltr',
            position: 'relative',
            display: 'grid',
            gridAutoFlow: 'column',
            gridTemplateRows: 'auto repeat(7, auto)',
            gridTemplateColumns: compact ? `auto repeat(${weeks}, 11px)` : `auto repeat(${weeks}, minmax(0, 1fr))`,
            gap: 3,
            width: compact ? 'max-content' : '100%',
        }}>
          {items}
          {tip && (<div style={{
                position: 'absolute',
                zIndex: 2,
                pointerEvents: 'none',
                width: 'max-content',
                maxWidth: 'min(280px, 100%)',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--md-on-surface)',
                color: 'var(--md-surface)',
                font: '500 12px var(--font-sans)',
                boxShadow: 'var(--md-shadow-1)',
                left: `clamp(0px, calc(26px + (100% - 26px) * ${(tip.col + 0.5) / weeks} - 140px), calc(100% - 280px))`,
                top: `calc(16px + (100% - 16px) * ${(tip.row + (tipBelow ? 1 : 0)) / 7} + ${tipBelow ? 6 : -32}px)`,
            }}>
              {tip.text}
            </div>)}
        </div>
      </div>
      {compact && olderAvailable && <div aria-hidden="true" style={{ position: 'absolute', left: 26, top: 0, bottom: 0, width: 14, pointerEvents: 'none', background: 'linear-gradient(to right, var(--md-surface), transparent)' }}/>}
      </div>
      <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontSize: 12,
            color: 'var(--md-on-surface-variant)',
        }}>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, lineHeight: 1.5 }}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}><rect x="1.5" y="1.5" width="13" height="13" rx="3"/><path d="M6 5v6M10 5v6"/></svg>
          <span>{text.closureNote}</span>
        </p>
        <div role="img" aria-label={`${text.less} → ${text.more}`} title={`${text.less} → ${text.more}`} style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {[0, 1, 2, 3, 4].map((l) => (<i key={l} style={{ ...legendCell, background: `var(--md-graph-${l})` }}/>))}
        </div>
      </div>
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
                {col.cells.map((cell) => (<td key={cell.key}>{cell.future ? '—' : `${cell.minutes}${isCampusClosedDay(cell.date) ? ` · ${text.closed}` : ''}`}</td>))}
              </tr>))}
          </tbody>
        </table>
      </div>
    </section>);
}
