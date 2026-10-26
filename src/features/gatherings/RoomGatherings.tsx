import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { Button, KindIcon, TableRow, TableTag } from '../../components';
import type { RoomGathering } from '../../data/gatheringsApi';
import { roomKey } from '../../data/focusApi';
import type { Room } from '../../domain/models';
import { tableShortWhen, TABLE_DAYS_AHEAD } from '../../domain/tables';
import { useI18n } from '../../i18n';
import { useGatherings } from './GatheringsContext';
import { GatheringSheet } from './GatheringSheet';

/**
 * Room detail, gatherings (O7, O14): New gathering for organizers of a
 * verified group, and the gatherings that make this room taken in the next
 * two weeks, for everyone, so nobody sets a table there.
 */
const glyph: CSSProperties = { width: 44, height: 44, borderRadius: '50%', background: 'var(--md-focus-container)', color: 'var(--md-focus)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

export function RoomGatherings({ room }: { room: Room }) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { api, hosting } = useGatherings();
  const [taken, setTaken] = useState<RoomGathering[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!api) return;
    let stale = false;
    const from = new Date();
    const to = new Date(from.getTime() + TABLE_DAYS_AHEAD * 24 * 3_600_000);
    api.inRoom(roomKey(room.ident), from, to).then((list) => !stale && setTaken(list)).catch(() => {});
    return () => {
      stale = true;
    };
  }, [api, room.ident]);

  if (!api) return null;
  const now = new Date();
  return (
    <>
      {hosting.length > 0 && (
        <Button variant="text" size="large" onClick={() => setOpen(true)} style={{ alignSelf: 'stretch' }}>
          {t('New gathering', 'Neues Treffen')}
        </Button>
      )}
      {taken.map((g) => (
        <TableRow
          key={g.link}
          card
          ring={<span style={glyph}><KindIcon kind={g.kind} /></span>}
          title={g.title}
          meta={`${tableShortWhen(g.startsAt, locale, now)} · ${g.orgName}`}
          tag={<TableTag tone="info">{t('Taken', 'Belegt')}</TableTag>}
          onClick={() => navigate(`/g/${g.link}`)}
        />
      ))}
      {hosting.length > 0 && (
        <GatheringSheet open={open} room={room} onClose={() => setOpen(false)}
          onSaved={(g) => { setOpen(false); navigate(`/g/${g.link}`); }} />
      )}
    </>
  );
}
