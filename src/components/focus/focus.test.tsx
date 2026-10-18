import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RoomCard } from '../app/RoomCard';
import { SegmentedControl } from '../core/SegmentedControl';
import { Sheet } from '../core/Sheet';
import { ActivityRow } from './ActivityRow';
import { FocusGraph, focusLevel } from './FocusGraph';
import type { FocusGraphText } from './FocusGraph';
import { FocusSurface } from './FocusSurface';
import type { FocusSurfaceText } from './FocusSurface';
import { semesterWeeks } from './ShareCard';

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

const graphText: FocusGraphText = {
  days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  cellLabel: (d, m) => `${d.getDate()} · ${m ? `${m} min` : 'No focus'}`,
  less: 'Less',
  more: 'More',
  closed: 'Campus closed',
  closureNote: 'Closed campus days pause your streak. Only open days count.',
  share: 'Share focus graph',
  tableCaption: 'Focus minutes per day, newest week first',
  weekOf: 'Week of',
  weekLabel: (d) => `${d.getDate()}.${d.getMonth() + 1}.`,
};

const surfaceText: FocusSurfaceText = {
  title: 'Focus session',
  private: 'Private',
  public: 'Public · AIN 7',
  visibility: 'Who sees this session',
  explainPrivate: 'Others see that someone is focusing here, not who.',
  explainPublic: 'AIN 7 sees you here and can join. Everyone else sees a focus session.',
  showName: 'Show my name',
  nameSub: 'Shown as "AIN 7 student"',
  lockedNote: 'Keeps running when your phone is locked.',
  end: 'End',
  signedOut: "Only you see this timer; the room doesn't show as claimed.",
  setup: 'Set Up Study Profile',
};

describe('focus graph levels', () => {
  it('counts whole Pomodoro blocks: 1 · 2–3 · 4–6 · 7+', () => {
    // 0 · a few minutes · 1 block · just short of 2 · 2 · 3 · 4 · 6 · 7 · a long day
    const minutes = [0, 5, 25, 49, 50, 75, 100, 150, 175, 600];
    expect(minutes.map(focusLevel)).toEqual([0, 1, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('puts a Deep block and a lecture-sized day where their Pomodoro count lands', () => {
    expect(focusLevel(50)).toBe(2); // one Deep block = two Pomodoros
    expect(focusLevel(180)).toBe(4); // two Lecture blocks
  });
});

describe('FocusGraph', () => {
  it('ends on the week of today, outlines today and leaves later days empty', async () => {
    // Tue 13 Oct 2026: Sun 11 Oct starts the last column.
    await render(
      <FocusGraph
        days={[
          { date: '2026-10-12', minutes: 200 },
          { date: '2026-10-13', minutes: 45 },
          { date: '2026-10-13', minutes: 40 },
        ]}
        today="2026-10-13"
        weeks={3}
        stats="1 h this semester"
        label="Focus graph"
        text={graphText}
      />,
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    // Newest week first: Sun closed, Mon 200, Tue 45 + 40, the rest of the week is still to come.
    const newest = Array.from(rows[0].querySelectorAll('td')).map((td) => td.textContent);
    expect(newest).toEqual(['0', '200', '85', '—', '—', '—', '—']);
    const outlined = Array.from(container.querySelectorAll<HTMLElement>('[aria-hidden="true"] div')).filter((el) =>
      el.style.outline.includes('solid'),
    );
    expect(outlined).toHaveLength(1);
    expect(outlined[0].style.background).toBe('var(--md-graph-2)');
  });

  it.each([false, true])('keeps activity violet and slashes empty confirmed closures (compact=%s)', async (compact) => {
    await render(<FocusGraph days={[{ date: '2026-12-25', minutes: 175 }]} today="2026-12-26" weeks={2}
      compact={compact} stats="0-day streak" label="Focus graph" text={graphText} />);
    const active = container.querySelector<HTMLElement>('[data-date="2026-12-25"]')!;
    const empty = container.querySelector<HTMLElement>('[data-date="2026-12-26"]')!;
    expect(active.style.background).toBe('var(--md-graph-4)');
    expect(active.dataset.rest).toBeUndefined();
    expect(empty.style.background).toBe('var(--md-graph-0)');
    expect(empty.dataset.rest).toBe('true');
    expect(empty.style.outline).toContain('solid');
    expect(active.title).toBe('25 · 175 min · Campus closed');
    expect(container.querySelector('tbody')?.textContent).toContain('175 · Campus closed');
    await act(async () => active.click());
    expect(container.querySelector('.thd-focus-detail')?.textContent).toBe('25 · 175 min · Campus closed');
  });

  it('lets a phone user jump to an older month and return to the latest week', async () => {
    await render(<FocusGraph days={[]} today="2026-10-18" stats="No focus yet." label="Focus graph" text={graphText} />);
    const scroller = container.querySelector<HTMLElement>('.thd-focus-graph-scroll')!;
    Object.defineProperty(scroller, 'scrollWidth', { value: 1200 });
    Object.defineProperty(scroller, 'clientWidth', { value: 320 });
    const month = container.querySelector('select')!;
    const january = Array.from(month.options).find(option => option.textContent === 'Jan 2026')!;
    const marker = container.querySelector<HTMLElement>(`[data-week="${january.value}"]`)!;
    marker.getBoundingClientRect = () => ({ left: 400 } as DOMRect);
    await act(async () => { month.value = january.value; month.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(scroller.scrollLeft).toBeGreaterThan(0);
    expect(scroller.scrollLeft).toBeLessThan(880);
    const latest = container.querySelector<HTMLElement>('[data-week="52"]')!;
    latest.getBoundingClientRect = () => ({ left: 1000 } as DOMRect);
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Latest week"]')!.click());
    expect(scroller.scrollLeft).toBe(880);
    expect(container.textContent).toContain('Less');
    expect(container.textContent).toContain('More');
  });

  it('hides Share until there is something to share', async () => {
    await render(<FocusGraph days={[]} today="2026-10-13" weeks={2} stats="No focus yet." label="Focus graph" text={graphText} />);
    expect(container.querySelector('button[aria-label="Share focus graph"]')).toBeNull();
  });
});

describe('SegmentedControl', () => {
  it('moves the selection with the arrow keys like a radio group', async () => {
    let value: 'private' | 'public' = 'private';
    const options = [
      { id: 'private' as const, label: 'Private' },
      { id: 'public' as const, label: 'Public' },
    ];
    await render(<SegmentedControl label="Visibility" value={value} onChange={(v) => (value = v)} options={options} />);
    const group = container.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(container.querySelector('[aria-checked="true"]')?.textContent).toBe('Private');
    await act(async () => {
      group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(value).toBe('public');
  });
});

describe('FocusSurface', () => {
  const base = {
    elapsed: '24:10',
    plannedLine: 'Planned end 12:36 · 3 h max',
    showName: false,
    text: surfaceText,
  };

  it('defaults to explaining Private and keeps the name switch for Public only', async () => {
    await render(<FocusSurface {...base} visibility="private" signedIn />);
    expect(container.textContent).toContain(surfaceText.explainPrivate);
    expect(container.querySelector('[role="switch"]')).toBeNull();

    await render(<FocusSurface {...base} visibility="public" signedIn />);
    expect(container.textContent).toContain(surfaceText.explainPublic);
    expect(container.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('false');
  });

  it('offers no visibility choice for a signed-out local timer', async () => {
    await render(<FocusSurface {...base} visibility="private" signedIn={false} onSetup={() => {}} />);
    expect(container.querySelector('[role="radiogroup"]')).toBeNull();
    expect(container.textContent).toContain(surfaceText.setup);
  });

  it('hides Set Up when the build has no focus service to set up with', async () => {
    await render(<FocusSurface {...base} visibility="private" signedIn={false} />);
    expect(container.textContent).toContain(surfaceText.signedOut);
    expect(container.textContent).not.toContain(surfaceText.setup);
  });
});

describe('RoomCard focus signals', () => {
  it('tints a claimed room dark purple but keeps its free duration', async () => {
    await render(
      <RoomCard
        name="E 212"
        meta="Building E · 60 seats"
        status="claimed"
        duration="4h"
        focus={{ kind: 'claimed', label: 'Focus session · 40 min' }}
      />,
    );
    expect(container.textContent).toContain('4h');
    expect(container.textContent).toContain('Focus session · 40 min');
    const duration = Array.from(container.querySelectorAll<HTMLElement>('div')).find((d) => d.textContent === '4h');
    expect(duration?.style.color).toBe('var(--status-claimed)');
  });
});

describe('ActivityRow', () => {
  it('announces activity as a status with words, not colour alone', async () => {
    await render(<ActivityRow kind="unknown" title="Focus activity unknown" />);
    const row = container.querySelector('[role="status"]');
    expect(row?.textContent).toBe('Focus activity unknown');
  });
});

describe('Sheet', () => {
  it('moves focus to the marked element and closes on Escape', async () => {
    let closed = false;
    await render(
      <Sheet open label="Still focusing in E 212?" onClose={() => (closed = true)}>
        <button type="button">End</button>
        <button type="button" data-autofocus="">
          Keep Going
        </button>
      </Sheet>,
    );
    expect(document.activeElement?.textContent).toBe('Keep Going');
    await act(async () => {
      (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(closed).toBe(true);
  });
});

describe('share card grid', () => {
  it('counts the semester in whole weeks from the week of its first day', () => {
    // Winter: Thu 1 Oct 2026 – Sun 14 Mar 2027 → Sun 27 Sep … Sun 14 Mar.
    expect(semesterWeeks('2026-10-01', '2027-03-14')).toBe(25);
    // Summer: Sun 15 Mar – Wed 30 Sep 2026 → Sun 15 Mar … Sun 27 Sep.
    expect(semesterWeeks('2026-03-15', '2026-09-30')).toBe(29);
  });
});
