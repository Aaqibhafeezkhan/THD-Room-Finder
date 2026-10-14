// Mirror of src/components/focus/FocusGraph.tsx with the types stripped. Edit the source, then run design/mirror-components.mjs.
import React, { useState } from 'react';
import { IconButton } from '../core/IconButton.jsx';
import { IconShare } from './focusIcons.jsx';

/**
 * The Profile hero (D2): a contribution graph of focus minutes. Square cells,
 * seven rows Mon → Sun, one column per week, the current week rightmost, today
 * outlined, days after today left as empty slots. Five levels from the
 * --md-graph-0…4 ramp (it follows the student's graph colour via data-accent).
 * Phones get fixed 11 px cells in a scroller that opens at the right edge;
 * wider windows fit every week with fluid cells. The grid itself is hidden from
 * screen readers: the section label carries the stats and a visually hidden
 * table lists every day's minutes. Hover or tap a cell for its day.
 */
/** Daily minutes → ramp level: 0 · <30 · <90 · <180 · 180+. */
export function focusLevel(minutes) {
    if (minutes <= 0)
        return 0;
    if (minutes < 30)
        return 1;
    if (minutes < 90)
        return 2;
    if (minutes < 180)
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
/** Monday of the week that contains d. */
export function mondayOf(d) {
    return addDays(d, -((d.getDay() + 6) % 7));
}
const hidden = {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
};
export function FocusGraph({ days, today, weeks = 53, compact = false, stats, label, text, onShare, style = {}, }) {
    const [tip, setTip] = useState(null);
    const minutesByDay = new Map();
    for (const d of days)
        minutesByDay.set(d.date, (minutesByDay.get(d.date) ?? 0) + d.minutes);
    const todayDate = parseDay(today);
    const firstMonday = addDays(mondayOf(todayDate), -(weeks - 1) * 7);
    const columns = [];
    for (let w = 0; w < weeks; w++) {
        const monday = addDays(firstMonday, w * 7);
        const prev = addDays(monday, -7);
        let month = monday.getMonth() !== prev.getMonth() ? text.months[monday.getMonth()] : '';
        if (w === 0) {
            const sameAhead = addDays(monday, 7).getMonth() === monday.getMonth() && addDays(monday, 14).getMonth() === monday.getMonth();
            month = sameAhead ? text.months[monday.getMonth()] : '';
        }
        const cells = [];
        for (let d = 0; d < 7; d++) {
            const date = addDays(monday, d);
            const key = dayKey(date);
            cells.push({ key, date, minutes: minutesByDay.get(key) ?? 0, future: date > todayDate, today: key === today });
        }
        columns.push({ monday, month, cells });
    }
    const items = [<div key="corner"/>];
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
          {i % 2 === 0 && i < 6 ? d : ''}
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
            const show = () => setTip({ key: cell.key, text: text.cellLabel(cell.date, cell.minutes), row: r, col: c });
            items.push(<div key={cell.key} onMouseEnter={show} onMouseLeave={() => setTip(null)} onClick={() => (tip?.key === cell.key ? setTip(null) : show())} style={{
                    width: '100%',
                    aspectRatio: '1',
                    alignSelf: 'start',
                    borderRadius: 2,
                    background: `var(--md-graph-${focusLevel(cell.minutes)})`,
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
            gap: 10,
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
            fontSize: 14,
            lineHeight: 1.4,
            color: 'var(--md-on-surface-variant)',
            textWrap: 'pretty',
        }}>
          {stats}
        </p>
        {onShare && (<IconButton label={text.share} onClick={onShare}>
            <IconShare size={20} strokeWidth={1.9}/>
          </IconButton>)}
      </div>
      <div style={{
            direction: 'rtl',
            overflowX: compact ? 'auto' : 'hidden',
            overflowY: 'hidden',
            scrollbarWidth: 'thin',
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
                whiteSpace: 'nowrap',
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--md-on-surface)',
                color: 'var(--md-surface)',
                font: '500 12px var(--font-sans)',
                boxShadow: 'var(--md-shadow-1)',
                left: `clamp(0px, calc(26px + (100% - 26px) * ${(tip.col + 0.5) / weeks} - 60px), calc(100% - 120px))`,
                top: `calc(16px + (100% - 16px) * ${(tip.row + (tipBelow ? 1 : 0)) / 7} + ${tipBelow ? 6 : -32}px)`,
            }}>
              {tip.text}
            </div>)}
        </div>
      </div>
      <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 3,
            fontSize: 12,
            color: 'var(--md-on-surface-variant)',
        }} aria-hidden="true">
        <span style={{ marginRight: 4 }}>{text.less}</span>
        {[0, 1, 2, 3, 4].map((l) => (<i key={l} style={{ ...legendCell, background: `var(--md-graph-${l})` }}/>))}
        <span style={{ marginLeft: 4 }}>{text.more}</span>
      </div>
      <table style={hidden}>
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
          {[...columns].reverse().map((col) => (<tr key={dayKey(col.monday)}>
              <th scope="row">{text.weekLabel(col.monday)}</th>
              {col.cells.map((cell) => (<td key={cell.key}>{cell.future ? '—' : cell.minutes}</td>))}
            </tr>))}
        </tbody>
      </table>
    </section>);
}
