import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { AppBar, Button, ConfirmDialog, ReplyBar, SeatRing, Sheet, Snackbar, StudyTableCard, TableTag } from '../../components';
import { IconMail } from '../../components/icons';
import { IconShare } from '../../components/focus/focusIcons';
import { ServiceError } from '../../data/identityApi';
import { roomKey } from '../../data/focusApi';
import type { Answer, StudyTable } from '../../data/tablesApi';
import { getEventsForDate } from '../../data/thabellaClient';
import type { Room } from '../../domain/models';
import { normalizeTableLink, roomConflict, roomsFreeFor, tableLink, tableState, tableWhen } from '../../domain/tables';
import { toCampusWallClock } from '../../domain/time';
import { isOnCampusMap } from '../../domain/campusAvailability';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';
import { PUBLIC_ORIGIN } from '../focus/shareSnapshot';
import { rhythmName } from '../focus/sessionView';
import { useRoomData } from '../rooms/RoomDataContext';
import { useFocusSession } from '../focus/FocusSessionContext';
import { computeRoomAvailability, getRoomSchedule } from '../../domain/availability';
import { planEnd } from '../../domain/focusSession';
import { InstallHint } from './InstallHint';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { SetupSheet } from '../profile/SetupSheet';
import { Page, Spinner, EmptyState } from '../shared/ui';
import { useTables } from './TablesContext';
import { TableSheet } from './TableSheet';
import { seatsTitle, tableErrorText, topicOf, whoLine } from './copy';

/**
 * A study table by its word link (S2, T6–T13, T17–T18): the seat ring, what,
 * when and where, who sits there, and Take a seat · Maybe · Can't. Readable
 * without an account; taking a seat signs in with the email code and a first
 * name, then sends the reply. The host shares, changes or cancels it.
 */
const fine: CSSProperties = { margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' };
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 };

export function TableScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const wide = useWideLayout();
  const { rooms, teachingIdents, events, campusHours } = useRoomData();
  const focus = useFocusSession();
  const [firstSeat, setFirstSeat] = useState(false);
  const { api, remember, mine: myTables } = useTables();
  const profile = useStudyProfile();
  const [table, setTable] = useState<StudyTable | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [conflict, setConflict] = useState<boolean | null>(null);
  const [freeRooms, setFreeRooms] = useState<Room[]>([]);
  const [pending, setPending] = useState<Answer | 'no' | null>(null);
  const [signIn, setSignIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState('');
  const finished = useRef(false);

  const link = normalizeTableLink(params.link);
  // The link-preview page sends people here with ?app; keep the shared URL clean.
  const { search } = useLocation();
  useEffect(() => {
    if (link && new URLSearchParams(search).has('app')) navigate(`/t/${link}`, { replace: true });
  }, [search]);
  const load = useCallback(async () => {
    if (!api || !link) return;
    try {
      setFailed(false);
      setTable(await api.get(link));
    } catch {
      setFailed(true);
    }
    // Re-read after sign-in: the reply and is_host depend on the viewer.
  }, [api, link, profile.email]);
  useEffect(() => {
    void load();
  }, [load]);
  // Offline or the service is down: one of your own tables can still be
  // shown, from the list this device saw last (it may arrive after the load).
  const saved = failed && !table ? myTables.find((x) => x.link === link) : undefined;
  useEffect(() => {
    if (!saved) return;
    setTable(saved);
    setSnack(t("Couldn't refresh. Showing what this device saw last.", 'Aktualisieren ging nicht. Du siehst den letzten Stand auf diesem Gerät.'));
  }, [saved]);
  // Back online after a failed load: read again.
  useEffect(() => {
    if (!failed) return;
    const again = () => void load();
    window.addEventListener('online', again);
    return () => window.removeEventListener('online', again);
  }, [failed, load]);

  // A lecture that appeared in the room after the table was set (T17).
  const ident = table?.roomKey.replace(/^thd:/, '') ?? null;
  useEffect(() => {
    if (!table || !ident || table.cancelled) return;
    let stale = false;
    const start = toCampusWallClock(table.startsAt);
    const end = toCampusWallClock(table.endsAt);
    getEventsForDate(start)
      .then((events) => {
        if (stale) return;
        setConflict(Boolean(roomConflict(events, ident, start, end)));
        setFreeRooms(roomsFreeFor(rooms.filter(isOnCampusMap), events, start, end, teachingIdents).slice(0, 8));
      })
      .catch(() => !stale && setConflict(null));
    return () => {
      stale = true;
    };
  }, [table?.link, table?.version, ident, rooms, teachingIdents]);

  // People at a table see each other's first names (T12); no name, no name shown.
  const reply = async (answer: Answer | 'no', showName = true) => {
    if (!api || !table) return;
    if (!profile.identity) {
      setPending(answer);
      setSignIn(true);
      return;
    }
    setBusy(true);
    try {
      const had = table.myAnswer;
      const saved = await api.reply(table.link, answer, showName);
      setTable(saved);
      remember(saved);
      if (answer === 'seat' && had !== 'seat') setFirstSeat(true);
    } catch (e) {
      setSnack(tableErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
      void load();
    } finally {
      setBusy(false);
    }
  };

  // After the quick sign-in, send the reply they tapped.
  useEffect(() => {
    if (pending && profile.identity && !signIn) {
      const answer = pending;
      setPending(null);
      void (async () => {
        await load();
        await reply(answer);
      })();
    }
  }, [pending, profile.identity, signIn]);

  const url = table ? tableLink(table.link, Capacitor.isNativePlatform() ? PUBLIC_ORIGIN : window.location.origin) : '';
  const subject = table ? topicOf(table, t) : '';
  const share = async () => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: subject, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setSnack(t('Link copied', 'Link kopiert'));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setSnack(t("Couldn't share the link", 'Link konnte nicht geteilt werden'));
    }
  };
  const mail = table
    ? `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `${subject} · ${tableWhen(table.startsAt, table.endsAt, locale)} · ${table.roomCode ?? ''}\n\n${url}`,
      )}`
    : '';

  const cancel = async () => {
    if (!api || !table) return;
    setCancelling(false);
    try {
      const saved = await api.cancel(table.link);
      setTable(saved);
      remember(saved);
    } catch (e) {
      setSnack(tableErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    }
  };

  const move = async (to: Room) => {
    if (!api || !table) return;
    setMoving(false);
    try {
      const saved = await api.change(table.link, table.version, {
        topic: table.topic,
        roomKey: roomKey(to.ident),
        startsAt: table.startsAt,
        minutes: Math.round((table.endsAt.getTime() - table.startsAt.getTime()) / 60_000),
        seats: table.seats,
        rhythm: table.rhythm,
        showName: true,
      });
      setTable(saved);
      remember(saved);
      setSnack(t(`Moved to ${to.code}`, `Nach ${to.code} verlegt`));
    } catch (e) {
      setSnack(tableErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    }
  };

  // Start together (T16): an ordinary session in the table's room with its
  // rhythm, anchored at the table's start once it has begun, so everyone's
  // breaks line up. It ends at the table's end, the next lecture or closing.
  const startFocus = async () => {
    const at = table ? rooms.find((r) => r.ident === table.roomKey.replace(/^thd:/, '')) : undefined;
    if (!table || !at) return;
    const now = new Date();
    const availability = computeRoomAvailability(getRoomSchedule(events, at.ident), now, campusHours.todayClose);
    if (availability.status === 'occupied') {
      setSnack(t(`${at.code} is in use right now.`, `${at.code} ist gerade belegt.`));
      return;
    }
    const endsAt = toCampusWallClock(table.endsAt);
    const limit = availability.freeUntil && availability.freeUntil < endsAt ? availability.freeUntil : endsAt;
    const planned = planEnd(now, limit, campusHours.todayClose);
    if (!planned) {
      setSnack(t('This study table is almost over.', 'Dieser Lerntisch ist fast vorbei.'));
      return;
    }
    const begun = table.startsAt.getTime() <= now.getTime();
    await focus.start({ ident: at.ident, code: at.code }, planned, {
      rhythm: table.rhythm,
      ...(begun && { join: { rhythm: table.rhythm, anchorAt: table.startsAt } }),
    });
    navigate(`/room/${encodeURIComponent(at.ident)}`);
  };

  const bar = (
    <AppBar
      mode="back" backLabel={t('Back', 'Zurück')}
      title={table?.isHost ? t('Your study table', 'Dein Lerntisch') : t('Study table', 'Lerntisch')}
      onBack={() => (history.length > 1 ? navigate(-1) : navigate('/'))}
      style={{ position: 'sticky', top: 0, zIndex: 10 }}
    />
  );

  // A refresh that fails keeps the table on screen; only a first load shows the error.
  if (!api || !link || table === null || (failed && !table)) {
    return (
      <>
        {bar}
        <EmptyState
          title={!api ? t('Study tables need the online service', 'Lerntische brauchen den Online-Dienst') : failed ? t("Couldn't load this study table", 'Lerntisch konnte nicht geladen werden') : t("This study table isn't here any more", 'Diesen Lerntisch gibt es nicht mehr')}
          hint={failed ? t('Check your connection and try again.', 'Prüfe deine Verbindung und versuche es erneut.') : t('It may have ended, or the link is incomplete.', 'Er ist vielleicht vorbei, oder der Link ist unvollständig.')}
        />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {failed && <Button variant="filled" onClick={() => void load()}>{t('Try again', 'Erneut versuchen')}</Button>}
          <Button variant="tonal" onClick={() => navigate('/')}>{t('Find a free room', 'Freien Raum finden')}</Button>
        </div>
      </>
    );
  }
  if (table === undefined) return <>{bar}<Spinner /></>;

  const state = tableState(table, new Date());
  const open = state !== 'cancelled' && state !== 'ended';
  const full = table.taken >= table.seats;
  const minutesTo = Math.max(1, Math.ceil((table.startsAt.getTime() - Date.now()) / 60_000));
  const room = ident ? rooms.find((r) => r.ident === ident) : undefined;
  const code = table.roomCode ?? room?.code ?? '';

  const tag: ReactNode =
    state === 'cancelled' ? <TableTag tone="alert">{t('Cancelled by the host', 'Vom Gastgeber abgesagt')}</TableTag>
    : state === 'ended' ? <TableTag tone="info">{t('This study table has ended', 'Dieser Lerntisch ist vorbei')}</TableTag>
    : state === 'live' ? <TableTag tone="focus">{t('Now', 'Jetzt')}</TableTag>
    : state === 'soon' ? <TableTag tone="focus">{t(`Starts in ${minutesTo} min`, `Beginnt in ${minutesTo} Min.`)}</TableTag>
    : full && table.seats > 1 ? <TableTag tone="info">{t(`Full · ${table.taken} of ${table.seats}`, `Voll · ${table.taken} von ${table.seats}`)}</TableTag>
    : table.changed ? <TableTag tone="info">{t('Changed', 'Geändert')}</TableTag>
    : undefined;

  const where: ReactNode = !open ? code : (
    <>
      {room ? (
        <a href={`/room/${encodeURIComponent(room.ident)}`} onClick={(e) => { e.preventDefault(); navigate(`/room/${encodeURIComponent(room.ident)}`); }} style={{ color: 'var(--md-primary)' }}>{code}</a>
      ) : code}
      {open && conflict === true && <span style={{ color: 'var(--md-error)' }}> · {t('a lecture is now scheduled here', 'hier ist jetzt eine Vorlesung')}</span>}
      {open && conflict === false && <span style={{ color: 'var(--md-tertiary)' }}> · {t(state === 'live' ? 'free now' : 'free then', state === 'live' ? 'jetzt frei' : 'dann frei')}</span>}
      {' · '}{rhythmName(table.rhythm, t)}
    </>
  );

  const mine = table.isHost ? 0 : table.myAnswer === 'seat' ? Math.max(0, table.taken - 1) : null;
  const ring = (
    <SeatRing seats={table.seats} taken={table.taken} mine={mine} label={code.replace(/\s+/g, '')} size={wide ? 240 : 168}
      cancelled={state === 'cancelled'} title={seatsTitle(table, t)} />
  );

  const replyText = {
    seat: t('Take a seat', 'Platz nehmen'),
    maybe: t('Maybe', 'Vielleicht'),
    cant: t("Can't", 'Kann nicht'),
    cantLong: t("Can't make it", 'Kann nicht'),
    seated: t("You're at this study table", 'Du sitzt an diesem Lerntisch'),
    maybeStatus: t('You said maybe', 'Du hast vielleicht gesagt'),
    full: t(`Full · ${table.taken} of ${table.seats}`, `Voll · ${table.taken} von ${table.seats}`),
  };

  const actions = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(state === 'soon' || state === 'live') && room && (table.isHost || table.myAnswer === 'seat') && !conflict && (
        focus.active?.roomIdent === room.ident ? (
          <Button variant="tonal" size="large" onClick={() => navigate(`/room/${encodeURIComponent(room.ident)}`)} style={{ width: wide ? undefined : '100%', alignSelf: wide ? 'flex-start' : undefined }}>
            {t('Open your session', 'Zu deiner Session')}
          </Button>
        ) : (
          <Button variant="filled" size="large" onClick={() => void startFocus()} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', width: wide ? undefined : '100%', alignSelf: wide ? 'flex-start' : undefined }}>
            {t(`Start focus in ${room.code}`, `Fokus in ${room.code} starten`)}
          </Button>
        )
      )}
      {open && table.isHost && conflict && (
        <Button variant="filled" size="large" onClick={() => setMoving(true)} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', width: wide ? undefined : '100%', alignSelf: wide ? 'flex-start' : undefined }}>
          {t('Move to a free room', 'In einen freien Raum verlegen')}
        </Button>
      )}
      {open && !table.isHost && table.seats > 1 && (
        <ReplyBar answer={table.myAnswer} full={full && table.myAnswer !== 'seat'} busy={busy} onReply={(a) => void reply(a)} text={replyText} inline={wide} />
      )}
      {open && table.seats > 1 && (table.isHost || table.myAnswer) && (
        <div style={row}>
          <Button variant="tonal" icon={<IconShare size={18} />} onClick={share}>{t('Share link', 'Link teilen')}</Button>
          <Button variant="text" icon={<IconMail size={18} />} href={mail}>{t('Email', 'E-Mail')}</Button>
          {table.isHost && <Button variant="text" onClick={() => setEditing(true)}>{t('Change', 'Ändern')}</Button>}
          {table.isHost && <Button variant="text" onClick={() => setCancelling(true)}>{t('Cancel study table', 'Lerntisch absagen')}</Button>}
        </div>
      )}
      {open && table.seats === 1 && table.isHost && (
        <div style={row}>
          <Button variant="text" onClick={() => setEditing(true)}>{t('Change', 'Ändern')}</Button>
          <Button variant="text" onClick={() => setCancelling(true)}>{t('Cancel', 'Absagen')}</Button>
        </div>
      )}
      {!open && (
        <Button variant="tonal" onClick={() => navigate('/')} style={{ alignSelf: wide ? 'flex-start' : 'stretch' }}>{t('Find a free room', 'Freien Raum finden')}</Button>
      )}
      {open && !table.isHost && !profile.identity && table.seats > 1 && (
        <p style={fine}>{t('Taking a seat signs you in with a code by email. No password.', 'Zum Platznehmen meldest du dich mit einem Code per E-Mail an. Kein Passwort.')}</p>
      )}
      {open && table.isHost && table.seats > 1 && (
        <p style={fine}>{url.replace(/^https?:\/\//, '').replace(table.link, '')}<b style={{ color: 'var(--md-on-surface)' }}>{table.link}</b></p>
      )}
      {open && !table.isHost && !table.myAnswer && table.seats > 1 && (
        <p style={fine}>{t('Anyone with this link can see the study table. An invite, not a room booking.', 'Alle mit diesem Link sehen den Lerntisch. Eine Einladung, keine Raumbuchung.')}</p>
      )}
    </div>
  );

  return (
    <>
      {bar}
      <Page style={wide ? { maxWidth: 960 } : undefined}>
        <StudyTableCard
          ring={ring}
          tag={tag}
          topic={topicOf(table, t)}
          when={tableWhen(table.startsAt, table.endsAt, locale, new Date())}
          where={where}
          who={open ? whoLine(table, t) : undefined}
          muted={!open}
          wide={wide}
        >
          {actions}
        </StudyTableCard>
        {!wide && actions}
        {firstSeat && <InstallHint />}
      </Page>

      <SetupSheet quick open={signIn}
        onDone={(m) => { finished.current = true; setSnack(m); }}
        onClose={() => {
          setSignIn(false);
          queueMicrotask(() => {
            if (!finished.current) setPending(null);
            finished.current = false;
          });
        }} />
      {room && (
        <TableSheet open={editing} room={room} table={table} onClose={() => setEditing(false)}
          onSaved={(saved) => { setTable(saved); setEditing(false); setSnack(t('Study table changed', 'Lerntisch geändert')); }} />
      )}
      <Sheet open={moving} onClose={() => setMoving(false)} label={t('Move to a free room', 'In einen freien Raum verlegen')} variant={wide ? 'dialog' : 'sheet'} width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 500 }}>{t('Free at the same time', 'Zur selben Zeit frei')}</h2>
          {freeRooms.length === 0 && <p style={fine}>{t('No other room is free then.', 'Dann ist kein anderer Raum frei.')}</p>}
          {freeRooms.map((r) => (
            <Button key={r.ident} variant="text" onClick={() => void move(r)} style={{ justifyContent: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</span>
            </Button>
          ))}
        </div>
      </Sheet>
      <ConfirmDialog
        open={cancelling}
        title={t('Cancel this study table?', 'Diesen Lerntisch absagen?')}
        body={t('Everyone with the link sees it as cancelled.', 'Alle mit dem Link sehen ihn als abgesagt.')}
        confirmLabel={t('Cancel study table', 'Lerntisch absagen')}
        cancelLabel={t('Keep it', 'Behalten')}
        onConfirm={cancel}
        onCancel={() => setCancelling(false)}
      />
      <Snackbar message={snack} onClose={() => setSnack('')} bottom={wide ? 24 : 96} />
    </>
  );
}
