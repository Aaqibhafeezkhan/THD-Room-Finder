import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, SeatRing, Sheet, choiceChip } from '../../components';
import { roomKey } from '../../data/focusApi';
import { ServiceError } from '../../data/identityApi';
import type { StudyTable } from '../../data/tablesApi';
import { formatTime } from '../../domain/format';
import { lectureLimit } from '../../domain/focusSession';
import type { Room } from '../../domain/models';
import { DEFAULT_SEATS, TABLE_SEATS, TOPIC_MAX, tableFromSession } from '../../domain/tables';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';
import { useFocusSession } from '../focus/FocusSessionContext';
import type { ActiveSession } from '../focus/FocusSessionContext';
import { rhythmName } from '../focus/sessionView';
import { useRoomData } from '../rooms/RoomDataContext';
import { tableErrorText } from './copy';
import { useTables } from './TablesContext';

/**
 * Invite people to the focus session you are running (#153, ADR 0010): the
 * room, "now" and the session's end and rhythm are given; only seats and a
 * topic are asked. Saving makes a study table already in progress, anchored
 * at the session's rhythm, and leaves the timer and its visibility alone.
 * Retries reuse one request id, so a lost answer never makes two tables.
 */
export interface SessionTableSheetProps {
  open: boolean;
  room: Room;
  onClose: () => void;
  onSaved: (table: StudyTable) => void;
}

const SESSION_TABLES = 'thd_session_tables';

/** The device's own note of which table a session became, by its start. */
function sessionKey(s: Pick<ActiveSession, 'roomIdent' | 'startedAt'>): string {
  return `${s.roomIdent}@${s.startedAt}`;
}

export function sessionTableLink(s: Pick<ActiveSession, 'roomIdent' | 'startedAt'> | null): string | null {
  if (!s) return null;
  try {
    const map = JSON.parse(localStorage.getItem(SESSION_TABLES) ?? '{}') as Record<string, string>;
    return typeof map[sessionKey(s)] === 'string' ? map[sessionKey(s)] : null;
  } catch {
    return null;
  }
}

function rememberSessionTable(s: Pick<ActiveSession, 'roomIdent' | 'startedAt'>, link: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(SESSION_TABLES) ?? '{}') as Record<string, string>;
    // Only today's matter; keep the note small.
    const recent = Object.entries(map).slice(-9);
    localStorage.setItem(SESSION_TABLES, JSON.stringify(Object.fromEntries([...recent, [sessionKey(s), link]])));
  } catch {
    /* blocked storage: the server still finds the table by its session */
  }
}

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

const field: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 48,
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

export function SessionTableSheet({ open, room, onClose, onSaved }: SessionTableSheetProps) {
  const { t } = useI18n();
  const wide = useWideLayout();
  const { api, remember } = useTables();
  const { active } = useFocusSession();
  const { events, schedule } = useRoomData();
  const [seats, setSeats] = useState<number>(DEFAULT_SEATS);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState(uuid);

  // A fresh request per opening; choices are kept for a retry after an error.
  useEffect(() => {
    if (!open) return;
    setError('');
    setRequestId(uuid());
  }, [open]);

  const here = active?.roomIdent === room.ident ? active : null;
  const vis = here?.visibility === 'public' ? t('Public', 'Öffentlich') : t('Private', 'Privat');

  /** What stands in the way right now, checked again on Invite. */
  const problem = (now: Date): string | null => {
    if (!here) return t('Your focus session here has ended.', 'Deine Fokus-Session hier ist vorbei.');
    const plan = tableFromSession({ anchorAt: new Date(here.anchorAt), plannedEnd: new Date(here.plannedEnd) }, now);
    if ('problem' in plan) {
      return plan.problem === 'too_short'
        ? t('Less than 25 minutes left, too short for others to come. Set a study table for later instead.', 'Weniger als 25 Minuten übrig, zu kurz zum Dazukommen. Plane stattdessen einen Lerntisch für später.')
        : plan.problem === 'too_long'
          ? t("This session follows a batch rhythm from too long ago. Set a new study table instead.", 'Diese Session folgt einem zu alten Jahrgangs-Rhythmus. Plane stattdessen einen neuen Lerntisch.')
          : t('Your focus session here has ended.', 'Deine Fokus-Session hier ist vorbei.');
    }
    if (schedule !== 'fresh' && schedule !== 'stale') {
      return t("Can't check the timetable right now, so nobody can be invited here. Try again in a moment.", 'Der Stundenplan ist gerade nicht prüfbar, daher kann niemand eingeladen werden. Versuche es gleich noch einmal.');
    }
    if (lectureLimit(events, room.ident, now, new Date(here.plannedEnd))) {
      return t('A lecture is now scheduled here before your session ends.', 'Hier ist jetzt vor dem Ende deiner Session eine Vorlesung.');
    }
    return null;
  };

  const blocked = open ? problem(new Date()) : null;

  const save = async () => {
    const now = new Date();
    const why = problem(now);
    if (why || !here || !api) {
      setError(why ?? '');
      return;
    }
    const plan = tableFromSession({ anchorAt: new Date(here.anchorAt), plannedEnd: new Date(here.plannedEnd) }, now);
    if ('problem' in plan) return;
    setBusy(true);
    setError('');
    try {
      const saved = await api.fromSession({
        requestId,
        topic: topic.trim() || null,
        roomKey: roomKey(room.ident),
        startsAt: plan.startsAt,
        endsAt: plan.endsAt,
        seats,
        rhythm: here.rhythm,
        sessionId: here.shared?.id ?? null,
      });
      remember(saved);
      rememberSessionTable(here, saved.link);
      onSaved(saved);
    } catch (e) {
      setError(tableErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    } finally {
      setBusy(false);
    }
  };

  const title = t('Invite people to your session', 'Leute zu deiner Session einladen');

  return (
    <Sheet open={open} onClose={onClose} label={title} variant={wide ? 'dialog' : 'sheet'} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 data-autofocus tabIndex={-1} style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 500, outline: 'none' }}>{title}</h2>
        {here && (
          <p style={{ margin: 0, fontSize: 'var(--body-large-size)' }}>
            <strong style={{ fontWeight: 500 }}>{room.code}</strong>
            {' · '}
            {t(`now until ${formatTime(new Date(here.plannedEnd))}`, `jetzt bis ${formatTime(new Date(here.plannedEnd))}`)}
            {' · '}
            {rhythmName(here.rhythm, t)}
          </p>
        )}
        <p style={fine}>
          {t(
            'Your timer keeps running. Whoever joins follows your blocks and breaks.',
            'Dein Timer läuft weiter. Wer dazukommt, folgt deinen Blöcken und Pausen.',
          )}
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span id="session-seats-label" style={label}>{t('Seats', 'Plätze')}</span>
            <div role="radiogroup" aria-labelledby="session-seats-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TABLE_SEATS.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={seats === n} onClick={() => setSeats(n)} style={choiceChip(seats === n, 'focus')}>
                  {n}
                </button>
              ))}
            </div>
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
          {t(
            `Anyone with the link sees the room, the time, the topic and your first name. Your session stays ${vis}, and nobody is invited until you share the link.`,
            `Wer den Link hat, sieht Raum, Zeit, Thema und deinen Vornamen. Deine Session bleibt ${vis}, und eingeladen ist erst, wem du den Link schickst.`,
          )}
        </p>
        {(error || blocked) && <p role="alert" style={{ ...fine, color: 'var(--md-error)' }}>{error || blocked}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: wide ? 'flex-end' : 'stretch' }}>
          {wide && <Button variant="text" onClick={onClose}>{t('Cancel', 'Abbrechen')}</Button>}
          <Button
            variant="filled"
            size="large"
            disabled={busy || Boolean(blocked)}
            aria-busy={busy || undefined}
            onClick={() => void save()}
            style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', width: wide ? undefined : '100%' }}
          >
            {busy ? t('Inviting…', 'Wird eingeladen…') : t('Invite people', 'Leute einladen')}
          </Button>
        </div>
        <p style={{ ...fine, textAlign: wide ? 'right' : 'center' }}>{t('An invite, not a room booking.', 'Eine Einladung, keine Raumbuchung.')}</p>
      </div>
    </Sheet>
  );
}
