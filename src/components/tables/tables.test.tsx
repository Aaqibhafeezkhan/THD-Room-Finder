import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ReplyBar } from './ReplyBar';
import type { ReplyBarText } from './ReplyBar';
import { SeatRing } from './SeatRing';
import { SlotChips } from './SlotChips';
import { StudyTogetherButton } from './StudyTogetherButton';

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

const text: ReplyBarText = {
  seat: 'Take a seat',
  maybe: 'Maybe',
  cant: "Can't",
  cantLong: "Can't make it",
  seated: "You're at this table",
  maybeStatus: 'You said maybe',
  full: 'Full · 6 of 6',
};

const buttons = () => [...container.querySelectorAll('button')];

describe('SeatRing', () => {
  it('draws one seat per place and fills the taken ones', async () => {
    await render(<SeatRing seats={6} taken={2} label="C001" title="2 of 6 seats taken" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-label')).toBe('2 of 6 seats taken');
    const filled = [...svg.querySelectorAll('circle')].filter((c) => c.getAttribute('fill') === 'var(--md-focus)');
    expect(filled).toHaveLength(2);
    expect(svg.querySelectorAll('g')).toHaveLength(6);
    expect(svg.textContent).toBe('C001');
  });

  it('rings the viewer’s seat and fades a cancelled table', async () => {
    await render(<SeatRing seats={4} taken={2} mine={1} cancelled title="Cancelled" />);
    const svg = container.querySelector('svg')!;
    expect(svg.style.opacity).toBe('0.38');
    expect(svg.querySelectorAll('g')[1].querySelectorAll('circle')).toHaveLength(2);
  });
});

describe('ReplyBar', () => {
  it('offers a seat, maybe and can’t to a guest', async () => {
    const got: string[] = [];
    await render(<ReplyBar answer={null} onReply={(a) => got.push(a)} text={text} />);
    expect(buttons().map((b) => b.textContent)).toEqual(['Take a seat', 'Maybe', "Can't make it"]);
    await act(async () => buttons()[0].click());
    expect(got).toEqual(['seat']);
  });

  it('keeps Maybe open when the table is full', async () => {
    await render(<ReplyBar answer={null} full onReply={() => {}} text={text} />);
    expect(buttons()[0].textContent).toBe('Full · 6 of 6');
    expect(buttons()[0].disabled).toBe(true);
    expect(buttons()[1].disabled).toBe(false);
  });

  it('tells a seated guest where they are', async () => {
    await render(<ReplyBar answer="seat" onReply={() => {}} text={text} />);
    expect(container.querySelector('[role="status"]')!.textContent).toBe("You're at this table");
    expect(buttons().map((b) => b.textContent)).toEqual(['Maybe', "Can't"]);
  });
});

describe('SlotChips', () => {
  it('does not pick a closed day and shows skeletons while loading', async () => {
    const picked: string[] = [];
    await render(
      <SlotChips
        days={[{ id: 'mon', label: 'Today' }, { id: 'sat', label: 'Sat', disabled: true, note: 'Closed' }]}
        day="mon"
        onDay={(d) => picked.push(d)}
        slots={null}
        slot={null}
        onSlot={() => {}}
        daysLabel="Day"
        slotsLabel="Start"
      />,
    );
    await act(async () => buttons()[1].click());
    expect(picked).toEqual([]);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('shows the empty line when a day has no free slot', async () => {
    await render(
      <SlotChips
        days={[{ id: 'thu', label: 'Thu' }]}
        day="thu"
        onDay={() => {}}
        slots={[]}
        slot={null}
        onSlot={() => {}}
        empty="No free slot on Thursday"
        daysLabel="Day"
        slotsLabel="Start"
      />,
    );
    expect(container.textContent).toContain('No free slot on Thursday');
  });
});

describe('StudyTogetherButton', () => {
  it('is one action without a session here', async () => {
    await render(<StudyTogetherButton label="Study together" onClick={() => {}} />);
    expect(buttons().map((b) => b.textContent)).toEqual(['Study together']);
  });

  it('puts the session shortcut first, as its own named button', async () => {
    const taps: string[] = [];
    await render(
      <StudyTogetherButton
        label="Study together"
        onClick={() => taps.push('table')}
        convert={{ label: 'Invite people to your focus session', onClick: () => taps.push('convert') }}
      />,
    );
    const [shortcut, main] = buttons();
    expect(shortcut.getAttribute('aria-label')).toBe('Invite people to your focus session');
    expect(main.textContent).toBe('Study together');
    await act(async () => shortcut.click());
    await act(async () => main.click());
    expect(taps).toEqual(['convert', 'table']);
  });
});
