import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { TableBanner } from '../../components';
import { tableState } from '../../domain/tables';
import { toCampusWallClock } from '../../domain/time';
import { formatTime } from '../../domain/format';
import { useI18n } from '../../i18n';
import { useWideLayout, useWindowClass } from '../../lib/useWindowClass';
import { useFocusSession } from '../focus/FocusSessionContext';
import { useTables } from './TablesContext';
import { useGatherings } from '../gatherings/GatheringsContext';
import { topicOf } from './copy';

/**
 * The reminder (S4, T15): from 15 minutes before a table the student hosts
 * or sits at, or a gathering they go to or organize, a banner on any tab
 * leads to it. Dismissed per table for the
 * browser session; hidden on the table's own page and while focusing.
 * Phones: above the bottom bar. Wide windows: bottom left of the content.
 */
const KEY = 'thd_table_reminders_dismissed';

function dismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function TableReminder() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mine } = useTables();
  const gatherings = useGatherings();
  const focus = useFocusSession();
  const wide = useWideLayout();
  // The shell shows the drawer on expanded windows and the rail otherwise.
  const drawer = useWindowClass() === 'expanded';
  const [now, setNow] = useState(() => new Date());
  const [hidden, setHidden] = useState<string[]>(dismissed);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const soon = (x: { startsAt: Date; endsAt: Date; cancelled: boolean }) => {
    const state = tableState(x, now);
    return state === 'soon' || state === 'live';
  };
  const items = [
    ...mine
      .filter((x) => soon(x) && (x.isHost || x.myAnswer === 'seat'))
      .map((x) => ({ key: x.link, path: `/t/${x.link}`, title: topicOf(x, t), startsAt: x.startsAt, endsAt: x.endsAt, roomCode: x.roomCode })),
    ...gatherings.mine
      .filter((g) => soon(g) && (g.isOrganizer || g.myAnswer === 'going'))
      .map((g) => ({ key: g.link, path: `/g/${g.link}`, title: g.title, startsAt: g.startsAt, endsAt: g.endsAt, roomCode: g.roomCode })),
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const table = items.find((x) => !hidden.includes(x.key));
  if (!table || focus.active || pathname === table.path) return null;

  const live = tableState({ ...table, cancelled: false }, now) === 'live';
  const title = table.title;
  const at = formatTime(toCampusWallClock(table.startsAt));
  const where = table.roomCode ? ` · ${table.roomCode}` : '';
  const close = () => {
    const next = [...hidden, table.key];
    setHidden(next);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* private mode: forget on reload */
    }
  };

  return (
    <TableBanner
      openLabel={t('Open', 'Öffnen')}
      dismissLabel={t('Dismiss', 'Ausblenden')}
      onOpen={() => navigate(table.path)}
      onDismiss={close}
      style={
        wide
          ? { position: 'fixed', bottom: 24, left: drawer ? 'calc(var(--nav-drawer-width) + 24px)' : 'calc(var(--nav-rail-width) + 24px)', width: 420, zIndex: 40 }
          : { position: 'fixed', left: 12, right: 12, bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))', zIndex: 40 }
      }
    >
      <b style={{ color: 'var(--md-focus)', fontWeight: 600 }}>{title}</b>
      {live ? t(` has started${where}`, ` hat begonnen${where}`) : t(` starts at ${at}${where}`, ` beginnt um ${at}${where}`)}
    </TableBanner>
  );
}
