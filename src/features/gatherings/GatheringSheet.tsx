import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, KindPicker, Sheet, SlotChips, choiceChip } from '../../components';
import type { SlotDay, SlotOption } from '../../components';
import type { HallKind } from '../../../shared/hall.js';
import { ServiceError } from '../../data/identityApi';
import type { Gathering } from '../../data/gatheringsApi';
import { getEventsForDate } from '../../data/thabellaClient';
import { roomKey } from '../../data/focusApi';
import type { Room, ScheduledEvent } from '../../domain/models';
import { getCampusHours } from '../../domain/openingHours';
import { campusNow, toCampusWallClock } from '../../domain/time';
import { dayId, dayName, freeSlots, fromCampusWallClock, tableDays } from '../../domain/tables';
import type { FreeSlot } from '../../domain/tables';
import { GATHERING_MAX, GATHERING_MAX_MINUTES, GATHERING_MIN, roomCapacity } from '../../domain/gatherings';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';
import { useGatherings } from './GatheringsContext';
import { gatheringErrorText, kindLabels } from './copy';

/**
 * New gathering (G1, O7–O9): for organizers of a verified group, from a
 * room. Days and the room's free slots as for tables (other gatherings in the
 * room count as taken), the kind, a name, THD's room approval reference and
 * the capacity, which is the room's seats unless the organizer asks for
 * fewer. Also changes a gathering. Bottom sheet on phones, dialog on wide.
 */
export interface GatheringSheetProps {
  open: boolean;
  room: Room;
  onClose: () => void;
  onSaved: (g: Gathering) => void;
  gathering?: Gathering | null;
}

const MIN = 60_000;
const field: CSSProperties = {
  width: '100%',
  minHeight: 48,
  boxSizing: 'border-box',
  padding: '0 14px',
  borderRadius: 'var(--radius-s)',
  border: '1px solid var(--md-outline)',
  background: 'var(--md-surface)',
  color: 'var(--md-on-surface)',
  fontSize: 'var(--body-large-size)',
  fontFamily: 'var(--font-sans)',
};
const fine: CSSProperties = { margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' };
const linkButton: CSSProperties = { border: 'none', background: 'none', padding: 0, color: 'var(--md-primary)', font: 'inherit', cursor: 'pointer' };

const hoursOn = (day: Date) => {
  const h = getCampusHours(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12));
  return { open: h.todayOpen, close: h.todayClose };
};
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function GatheringSheet({ open, room, onClose, onSaved, gathering }: GatheringSheetProps) {
  const { t, locale } = useI18n();
  const wide = useWideLayout();
  const { api, hosting, remember } = useGatherings();
  const roomSeats = roomCapacity(room);

  const [now, setNow] = useState(campusNow);
  const days = useMemo(() => tableDays(now, hoursOn), [now]);
  const [group, setGroup] = useState('');
  const [day, setDay] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [kind, setKind] = useState<HallKind>('games');
  const [title, setTitle] = useState('');
  const [approval, setApproval] = useState('');
  const [fewer, setFewer] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [loaded, setLoaded] = useState<{ day: string; events: ScheduledEvent[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const advanced = useRef(false);

  useEffect(() => {
    if (!open) return;
    const at = campusNow();
    setNow(at);
    const start = gathering ? toCampusWallClock(gathering.startsAt) : null;
    const firstOpen = tableDays(at, hoursOn).find((d) => d.open && d.close && d.close > at);
    setGroup(gathering?.org.slug ?? hosting[0]?.slug ?? '');
    setDay(start ? dayId(start) : (firstOpen?.id ?? dayId(at)));
    setSlot(start ? hhmm(start) : null);
    setKind(gathering?.kind ?? 'games');
    setTitle(gathering?.title ?? '');
    setApproval('');
    const cap = gathering?.capacity ?? roomSeats;
    setFewer(Boolean(gathering && roomSeats && gathering.capacity < roomSeats) || !roomSeats);
    setCapacity(cap ? String(cap) : '');
    setLoaded(null);
    setError('');
    advanced.current = Boolean(gathering);
    // Only on open.
  }, [open]);

  const picked = days.find((d) => d.id === day) ?? null;

  // That day's timetable and gatherings in the room: both make it taken.
  useEffect(() => {
    if (!open || !picked || !api) return;
    let stale = false;
    const id = picked.id;
    const from = fromCampusWallClock(picked.date);
    const to = new Date(from.getTime() + 24 * 60 * MIN);
    Promise.all([getEventsForDate(picked.date).catch(() => []), api.inRoom(roomKey(room.ident), from, to).catch(() => [])]).then(([events, others]) => {
      if (stale) return;
      const mine = events.filter((e) => e.roomIdent === room.ident);
      const taken = others
        .filter((o) => o.link !== gathering?.link)
        .map((o) => ({ id: -1, roomIdent: room.ident, roomName: null, eventType: 'gathering', durationMinutes: 0, startDateTime: toCampusWallClock(o.startsAt), endDateTime: toCampusWallClock(o.endsAt) }) as ScheduledEvent);
      setLoaded({ day: id, events: [...mine, ...taken] });
    });
    return () => {
      stale = true;
    };
  }, [open, day, room.ident, api]);

  const slots: FreeSlot[] | null = useMemo(() => {
    if (!picked || !loaded || loaded.day !== picked.id) return null;
    const list = freeSlots(picked, loaded.events, now, GATHERING_MAX_MINUTES);
    if (gathering) {
      const start = toCampusWallClock(gathering.startsAt);
      if (dayId(start) === picked.id && !list.some((s) => s.id === hhmm(start))) {
        const end = toCampusWallClock(gathering.endsAt);
        list.unshift({ id: hhmm(start), start, end, minutes: Math.round((end.getTime() - start.getTime()) / MIN) });
      }
    }
    return list;
  }, [picked, loaded, now, gathering]);

  useEffect(() => {
    if (slots && !(slot && slots.some((s) => s.id === slot))) setSlot(slots[0]?.id ?? null);
  }, [slots]);
  const next = useMemo(() => (slots && !slots.length && picked ? (days.find((d) => d.offset > picked.offset && d.open) ?? null) : null), [slots, picked, days]);
  useEffect(() => {
    if (!advanced.current && slots) {
      advanced.current = true;
      if (!slots.length && next) setDay(next.id);
    }
  }, [slots, next]);

  const chosen = slots?.find((s) => s.id === slot) ?? null;
  const cap = Number.parseInt(capacity, 10);
  const maxCap = roomSeats ?? GATHERING_MAX;
  const capOk = Number.isFinite(cap) && cap >= GATHERING_MIN && cap <= maxCap;
  const labels = kindLabels(t);

  const dayChips: SlotDay[] = days.map((d) => ({
    id: d.id,
    label: d.offset < 7 ? dayName(d.date, locale, now) : `${dayName(d.date, locale)} ${d.date.getDate()}`,
    disabled: !d.open || (d.offset === 0 && Boolean(d.close && d.close <= now)),
  }));
  const slotChips: SlotOption[] | null =
    slots?.map((s) => ({ id: s.id, start: s.id, free: t(`until ${hhmm(s.end)}`, `bis ${hhmm(s.end)}`) })) ?? null;

  const save = async () => {
    if (!api || !chosen || !group || !capOk) return;
    setBusy(true);
    setError('');
    const input = {
      kind,
      title: title.trim() || labels[kind],
      description: null,
      roomKey: roomKey(room.ident),
      startsAt: fromCampusWallClock(chosen.start),
      minutes: Math.min(GATHERING_MAX_MINUTES, chosen.minutes),
      capacity: cap,
      // Empty on a change keeps the stored reference.
      approvalRef: approval.trim(),
    };
    try {
      const saved = gathering ? await api.change(gathering.link, gathering.version, input) : await api.set(group, input);
      remember(saved);
      onSaved(saved);
    } catch (e) {
      setError(gatheringErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    } finally {
      setBusy(false);
    }
  };

  const groupName = hosting.find((g) => g.slug === group)?.name ?? gathering?.org.name ?? '';
  const heading = gathering ? t(`Change the gathering in ${room.code}`, `Treffen in ${room.code} ändern`) : t(`New gathering in ${room.code}`, `Neues Treffen in ${room.code}`);

  return (
    <Sheet open={open} onClose={onClose} label={heading} variant={wide ? 'dialog' : 'sheet'} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 data-autofocus tabIndex={-1} style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 500, outline: 'none' }}>{heading}</h2>
          {hosting.length <= 1 && groupName && <p style={{ ...fine, marginTop: 4 }}>{t(`As ${groupName}`, `Als ${groupName}`)}</p>}
        </div>
        {!gathering && hosting.length > 1 && (
          <div role="radiogroup" aria-label={t('Group', 'Gruppe')} style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {hosting.map((g) => (
              <button key={g.slug} type="button" role="radio" aria-checked={g.slug === group} onClick={() => setGroup(g.slug)} style={choiceChip(g.slug === group, 'focus')}>
                {g.name}
              </button>
            ))}
          </div>
        )}
        <SlotChips
          days={dayChips}
          day={day}
          onDay={setDay}
          slots={slotChips}
          slot={slot}
          onSlot={setSlot}
          empty={next ? t(`No free slot · next: ${dayName(next.date, 'en', now)}`, `Kein freier Slot · nächster: ${dayName(next.date, 'de', now)}`) : t('No free slot', 'Kein freier Slot')}
          daysLabel={t('Day', 'Tag')}
          slotsLabel={t('Start', 'Beginn')}
        />
        <KindPicker value={kind} onChange={setKind} labels={labels} label={t('Kind', 'Art')} />
        <input aria-label={t('Name', 'Name')} placeholder={t(`Name · ${labels[kind]}`, `Name · ${labels[kind]}`)} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} style={field} />
        <input
          aria-label={t('THD room approval reference', 'Raumfreigabe der THD')}
          placeholder={gathering ? t('THD room approval reference (unchanged)', 'Raumfreigabe der THD (unverändert)') : t('THD room approval reference', 'Raumfreigabe der THD')}
          value={approval}
          maxLength={60}
          onChange={(e) => setApproval(e.target.value)}
          style={field}
        />
        {fewer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              aria-label={t('People', 'Personen')}
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value.replace(/\D/g, '').slice(0, 3))}
              style={{ ...field, width: 96 }}
            />
            <span style={fine}>
              {roomSeats
                ? t(`people · up to ${roomSeats}, the room's seats`, `Personen · bis ${roomSeats}, die Plätze im Raum`)
                : t(`people · ${GATHERING_MIN} to ${GATHERING_MAX}; THabella doesn't know this room's seats`, `Personen · ${GATHERING_MIN} bis ${GATHERING_MAX}; THabella kennt die Plätze nicht`)}
            </span>
          </div>
        ) : (
          <p style={fine}>
            {t(`Up to ${roomSeats} people · the room's seats · `, `Bis ${roomSeats} Personen · die Plätze im Raum · `)}
            <button type="button" onClick={() => setFewer(true)} style={linkButton}>{t('Fewer', 'Weniger')}</button>
          </p>
        )}
        {error && <p role="alert" style={{ ...fine, color: 'var(--md-error)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: wide ? 'flex-end' : 'stretch' }}>
          {wide && <Button variant="text" onClick={onClose}>{t('Cancel', 'Abbrechen')}</Button>}
          <Button
            variant="filled"
            size="large"
            disabled={busy || !chosen || !capOk || (!gathering && approval.trim().length < 2)}
            onClick={save}
            style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', width: wide ? undefined : '100%' }}
          >
            {gathering ? t('Save changes', 'Änderungen speichern') : t('Create gathering', 'Treffen anlegen')}
          </Button>
        </div>
        <p style={{ ...fine, textAlign: wide ? 'right' : 'center' }}>{t('Only for rooms THD approved for your group.', 'Nur für Räume, die die THD deiner Gruppe freigegeben hat.')}</p>
      </div>
    </Sheet>
  );
}
