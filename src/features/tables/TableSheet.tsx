import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { Button, SeatRing, Sheet, SlotChips, choiceChip } from '../../components';
import type { SlotDay, SlotOption } from '../../components';
import { ServiceError } from '../../data/identityApi';
import type { StudyTable } from '../../data/tablesApi';
import { getEventsForDate } from '../../data/thabellaClient';
import { roomKey } from '../../data/focusApi';
import type { Room, ScheduledEvent } from '../../domain/models';
import { getCampusHours } from '../../domain/openingHours';
import { campusNow, toCampusWallClock } from '../../domain/time';
import {
  DEFAULT_SEATS,
  TABLE_MAX_MINUTES,
  TABLE_SEATS,
  TOPIC_MAX,
  dayId,
  dayName,
  freeSlots,
  fromCampusWallClock,
  slotLength,
  tableDays,
} from '../../domain/tables';
import type { FreeSlot } from '../../domain/tables';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';
import { RhythmSheet } from '../focus/RhythmSheet';
import { useRhythmPreference } from '../focus/rhythmPreference';
import { rhythmName } from '../focus/sessionView';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { useTables } from './TablesContext';
import { useGatherings } from '../gatherings/GatheringsContext';
import { tableErrorText } from './copy';

/**
 * Set a table (S1, T1–T5): from a room, pick a day, one of the room's free
 * slots on the lecture grid, the seats and an optional topic. The length is
 * the slot, the rhythm is the student's own. Also changes a table for its
 * host. A bottom sheet on phones, a 560 px dialog on wide windows.
 */
export interface TableSheetProps {
  open: boolean;
  room: Room;
  onClose: () => void;
  onSaved: (table: StudyTable) => void;
  table?: StudyTable | null;
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
const label: CSSProperties = { fontSize: 'var(--label-large-size)', color: 'var(--md-on-surface-variant)' };
const fine: CSSProperties = { margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' };

const hoursOn = (day: Date) => {
  const h = getCampusHours(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12));
  return { open: h.todayOpen, close: h.todayClose };
};

export function TableSheet({ open, room, onClose, onSaved, table }: TableSheetProps) {
  const { t, locale } = useI18n();
  const wide = useWideLayout();
  const navigate = useNavigate();
  const { api, remember } = useTables();
  const gatherings = useGatherings();
  const profile = useStudyProfile();
  const [preferred] = useRhythmPreference();

  const [now, setNow] = useState(campusNow);
  const days = useMemo(() => tableDays(now, hoursOn), [now]);
  const [day, setDay] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [seats, setSeats] = useState<number>(DEFAULT_SEATS);
  const [topic, setTopic] = useState('');
  const [rhythm, setRhythm] = useState(preferred);
  const [pickRhythm, setPickRhythm] = useState(false);
  const [showName, setShowName] = useState(false);
  // The room's events, tagged with the day they belong to.
  const [loaded, setLoaded] = useState<{ day: string; events: ScheduledEvent[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const at = campusNow();
    setNow(at);
    const start = table ? toCampusWallClock(table.startsAt) : null;
    const firstOpen = tableDays(at, hoursOn).find((d) => d.open && d.close && d.close > at);
    setDay(start ? dayId(start) : (firstOpen?.id ?? dayId(at)));
    setLoaded(null);
    setSlot(start ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}` : null);
    setSeats(table?.seats ?? DEFAULT_SEATS);
    setTopic(table?.topic ?? '');
    setRhythm(table?.rhythm ?? preferred);
    setShowName(table ? table.hostShowName : (profile.identity?.showName ?? false));
    setError('');
    // Only on open.
  }, [open]);

  const picked = days.find((d) => d.id === day) ?? null;

  // That day's timetable, to offer only the room's free slots.
  useEffect(() => {
    if (!open || !picked) return;
    let stale = false;
    const id = picked.id;
    // Lectures and gatherings in the room both make it taken.
    const from = fromCampusWallClock(picked.date);
    const to = new Date(from.getTime() + 24 * 60 * MIN);
    Promise.all([
      getEventsForDate(picked.date).catch(() => [] as ScheduledEvent[]),
      gatherings.api ? gatherings.api.inRoom(roomKey(room.ident), from, to).catch(() => []) : Promise.resolve([]),
    ]).then(([events, others]) => {
      if (stale) return;
      const taken = others.map((o) => ({ id: -1, roomIdent: room.ident, roomName: null, eventType: 'gathering', durationMinutes: 0,
        startDateTime: toCampusWallClock(o.startsAt), endDateTime: toCampusWallClock(o.endsAt) }) as ScheduledEvent);
      setLoaded({ day: id, events: [...events.filter((x) => x.roomIdent === room.ident), ...taken] });
    });
    return () => {
      stale = true;
    };
  }, [open, day, room.ident]);

  const slots: FreeSlot[] | null = useMemo(() => {
    if (!picked || !loaded || loaded.day !== picked.id) return null;
    const list = freeSlots(picked, loaded.events, now);
    // Changing a table keeps its own time on offer even off the grid.
    if (table) {
      const start = toCampusWallClock(table.startsAt);
      const own = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
      if (dayId(start) === picked.id && !list.some((s) => s.id === own)) {
        const end = toCampusWallClock(table.endsAt);
        list.unshift({ id: own, start, end, minutes: Math.round((end.getTime() - start.getTime()) / MIN) });
      }
    }
    return list;
  }, [picked, loaded, now, table]);

  useEffect(() => {
    if (slots && !(slot && slots.some((s) => s.id === slot))) setSlot(slots[0]?.id ?? null);
  }, [slots]);

  // On open, move on to the next day when the first one has no free slot.
  const advanced = useRef(false);
  useEffect(() => {
    if (open) advanced.current = Boolean(table);
  }, [open]);

  const chosen = slots?.find((s) => s.id === slot) ?? null;
  const next = useMemo(() => {
    if (!slots || slots.length || !picked) return null;
    return days.find((d) => d.offset > picked.offset && d.open) ?? null;
  }, [slots, picked, days]);
  useEffect(() => {
    if (!advanced.current && slots) {
      advanced.current = true;
      if (!slots.length && next) setDay(next.id);
    }
  }, [slots, next]);

  // One row of days (S1): Today, Tomorrow, weekdays, then weekday and date
  // in the second week. Closed days are shown greyed out.
  const dayChips: SlotDay[] = days.map((d) => ({
    id: d.id,
    label: d.offset < 7 ? dayName(d.date, locale, now) : `${dayName(d.date, locale)} ${d.date.getDate()}`,
    disabled: !d.open || (d.offset === 0 && Boolean(d.close && d.close <= now)),
  }));
  const slotChips: SlotOption[] | null = slots?.map((s) => ({ id: s.id, start: s.id, free: slotLength(s.minutes) })) ?? null;
  const emptyLine = picked
    ? t(
        `No free slot ${picked.offset === 0 ? 'left today' : `on ${dayName(picked.date, 'en')}`}${next ? ` · next: ${dayName(next.date, 'en', now)}` : ''}`,
        `Kein freier Slot ${picked.offset === 0 ? 'mehr heute' : `am ${dayName(picked.date, 'de')}`}${next ? ` · nächster: ${dayName(next.date, 'de', now)}` : ''}`,
      )
    : '';

  const save = async () => {
    if (!api || !chosen) return;
    setBusy(true);
    setError('');
    const input = {
      topic: topic.trim() || null,
      roomKey: roomKey(room.ident),
      startsAt: fromCampusWallClock(chosen.start),
      minutes: Math.min(TABLE_MAX_MINUTES, chosen.minutes),
      seats,
      rhythm,
      showName,
    };
    try {
      const saved = table ? await api.change(table.link, table.version, input) : await api.set(input);
      remember(saved);
      onSaved(saved);
    } catch (e) {
      setError(tableErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    } finally {
      setBusy(false);
    }
  };

  const title = table ? t(`Change the table in ${room.code}`, `Tisch in ${room.code} ändern`) : t(`Set a table in ${room.code}`, `Lerntisch in ${room.code} anlegen`);
  const seatChoices = [...TABLE_SEATS, 1];

  return (
    <>
      <Sheet open={open && !pickRhythm} onClose={onClose} label={title} variant={wide ? 'dialog' : 'sheet'} width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 data-autofocus tabIndex={-1} style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 500, outline: 'none' }}>{title}</h2>
          <SlotChips
            days={dayChips}
            day={day}
            onDay={setDay}
            slots={slotChips}
            slot={slot}
            onSlot={setSlot}
            empty={emptyLine}
            daysLabel={t('Day', 'Tag')}
            slotsLabel={t('Start', 'Beginn')}
          />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span id="seats-label" style={label}>{t('Seats', 'Plätze')}</span>
              <div role="radiogroup" aria-labelledby="seats-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {seatChoices.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={seats === n} onClick={() => setSeats(n)} style={choiceChip(seats === n, 'focus')}>
                    {n === 1 ? t('Just me', 'Nur ich') : n}
                  </button>
                ))}
              </div>
              {seats === 1 ? (
                <p style={fine}>{t('A planned solo session. No link to share.', 'Eine geplante Solo-Session. Kein Link zum Teilen.')}</p>
              ) : gatherings.api && (
                <p style={fine}>
                  {t('More people? ', 'Mehr Leute? ')}
                  <button type="button" onClick={() => { onClose(); navigate('/profile?register'); }} style={{ border: 'none', background: 'none', padding: 0, color: 'var(--md-primary)', font: 'inherit', cursor: 'pointer' }}>
                    {t('Register your group', 'Gruppe registrieren')}
                  </button>
                </p>
              )}
            </div>
            {wide && <SeatRing seats={seats} taken={1} mine={0} label={room.code} size={120} title={t(`${seats} seats`, `${seats} Plätze`)} />}
          </div>
          <input
            aria-label={t('What are you studying?', 'Was lernst du?')}
            placeholder={t('What are you studying?', 'Was lernst du?')}
            value={topic}
            maxLength={TOPIC_MAX}
            onChange={(e) => setTopic(e.target.value)}
            style={field}
          />
          <p style={fine}>
            {rhythmName(rhythm, t)} · {t(`${rhythm.focus} min focus, ${rhythm.break} min break`, `${rhythm.focus} Min. Fokus, ${rhythm.break} Min. Pause`)} ·{' '}
            <button type="button" onClick={() => setPickRhythm(true)} style={{ border: 'none', background: 'none', padding: 0, color: 'var(--md-primary)', font: 'inherit', cursor: 'pointer' }}>
              {t('Change', 'Ändern')}
            </button>
          </p>
          {error && <p role="alert" style={{ ...fine, color: 'var(--md-error)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: wide ? 'flex-end' : 'stretch' }}>
            {wide && <Button variant="text" onClick={onClose}>{t('Cancel', 'Abbrechen')}</Button>}
            <Button
              variant="filled"
              size="large"
              disabled={busy || !chosen}
              onClick={save}
              style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', width: wide ? undefined : '100%' }}
            >
              {table ? t('Save changes', 'Änderungen speichern') : t('Set table', 'Tisch anlegen')}
            </Button>
          </div>
          <p style={{ ...fine, textAlign: wide ? 'right' : 'center' }}>{t('An invite, not a room booking.', 'Eine Einladung, keine Raumbuchung.')}</p>
        </div>
      </Sheet>
      <RhythmSheet
        open={open && pickRhythm}
        title={t('Rhythm for this table', 'Rhythmus für diesen Tisch')}
        value={rhythm}
        onClose={() => setPickRhythm(false)}
        onPick={(r) => {
          setRhythm(r);
          setPickRhythm(false);
        }}
      />
    </>
  );
}
