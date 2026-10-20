import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AppBar, Button, ConfirmDialog, Hall, ReplyBar, Snackbar, StudyTableCard, TableTag, VerifiedTag } from '../../components';
import { IconShare } from '../../components/focus/focusIcons';
import { ServiceError } from '../../data/identityApi';
import type { Gathering, Person } from '../../data/gatheringsApi';
import { normalizeGatheringLink, planFor, programmeCounts, peopleCsv } from '../../domain/gatherings';
import { tableState, tableWhen } from '../../domain/tables';
import { toCampusWallClock } from '../../domain/time';
import { computeRoomAvailability, getRoomSchedule } from '../../domain/availability';
import { planEnd } from '../../domain/focusSession';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';
import { PUBLIC_ORIGIN } from '../focus/shareSnapshot';
import { useFocusSession } from '../focus/FocusSessionContext';
import { useRoomData } from '../rooms/RoomDataContext';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { SetupSheet } from '../profile/SetupSheet';
import { Page, Spinner, EmptyState } from '../shared/ui';
import { useGatherings } from './GatheringsContext';
import { GatheringSheet } from './GatheringSheet';
import { PeopleSheet } from './PeopleSheet';
import { countLine, gatheringErrorText, hallTitle, kindLabels } from './copy';

/**
 * A gathering by its word link (G2, O10–O13): the room set up for its kind
 * with people in reply order, what, when, where, and Going · Maybe · Can't.
 * Readable without an account; replying signs in with the email code and
 * shares name, programme and batch with the group, which the page says
 * first. Full gatherings offer the waiting list. Organizers see what to plan
 * for and the people list.
 */
/** Group focus runs one rhythm for everyone, so breaks line up. */
const GROUP_RHYTHM = { focus: 50, break: 10, longBreak: 0, longEvery: 0 };
const fine: CSSProperties = { margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' };
const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 };
const list: CSSProperties = { background: 'var(--md-surface)', borderRadius: 'var(--radius-l)', boxShadow: 'var(--md-shadow-1)', overflow: 'hidden' };
const line: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' };

export function GatheringScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { t, locale } = useI18n();
  const wide = useWideLayout();
  const { rooms, events, campusHours } = useRoomData();
  const focus = useFocusSession();
  const { api, remember } = useGatherings();
  const profile = useStudyProfile();
  const [g, setG] = useState<Gathering | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [pending, setPending] = useState<'going' | 'maybe' | 'no' | null>(null);
  const [signIn, setSignIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState('');
  const finished = useRef(false);

  const link = normalizeGatheringLink(params.link);
  useEffect(() => {
    if (link && new URLSearchParams(search).has('app')) navigate(`/g/${link}`, { replace: true });
  }, [search]);

  const load = useCallback(async () => {
    if (!api || !link) return;
    try {
      setFailed(false);
      const got = await api.get(link);
      setG(got);
      if (got?.isOrganizer) setPeople(await api.people(link).catch(() => null));
    } catch {
      setFailed(true);
    }
  }, [api, link, profile.email]);
  useEffect(() => {
    void load();
  }, [load]);

  const reply = async (answer: 'going' | 'maybe' | 'no') => {
    if (!api || !g) return;
    if (!profile.identity) {
      setPending(answer);
      setSignIn(true);
      return;
    }
    setBusy(true);
    try {
      // The page shows what the group sees before the first reply (O11).
      const saved = await api.reply(g.link, answer, true);
      setG(saved);
      remember(saved);
      if (saved.myAnswer === 'waiting') setSnack(t('The room is full: you are on the waiting list.', 'Der Raum ist voll: du stehst auf der Warteliste.'));
    } catch (e) {
      setSnack(gatheringErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
      void load();
    } finally {
      setBusy(false);
    }
  };

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

  const url = g ? `${(Capacitor.isNativePlatform() ? PUBLIC_ORIGIN : window.location.origin).replace(/\/$/, '')}/g/${g.link}` : '';
  const share = async () => {
    if (!g) return;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: g.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setSnack(t('Link copied', 'Link kopiert'));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setSnack(t("Couldn't share the link", 'Link konnte nicht geteilt werden'));
    }
  };
  const exportCsv = () => {
    if (!g || !people) return;
    const blob = new Blob([peopleCsv(people, new Date())], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${g.link}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const cancel = async () => {
    if (!api || !g) return;
    setCancelling(false);
    try {
      const saved = await api.cancel(g.link);
      setG(saved);
      remember(saved);
    } catch (e) {
      setSnack(gatheringErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    }
  };

  const room = g ? rooms.find((r) => r.ident === g.roomKey.replace(/^thd:/, '')) : undefined;
  // Group focus starts a session for everyone, like a table (T16).
  const startFocus = async () => {
    if (!g || !room) return;
    const now = new Date();
    const availability = computeRoomAvailability(getRoomSchedule(events, room.ident), now, campusHours.todayClose);
    const endsAt = toCampusWallClock(g.endsAt);
    const limit = availability.freeUntil && availability.freeUntil < endsAt ? availability.freeUntil : endsAt;
    const planned = planEnd(now, limit, campusHours.todayClose);
    if (!planned) return;
    const begun = g.startsAt.getTime() <= now.getTime();
    const rhythm = GROUP_RHYTHM;
    await focus.start({ ident: room.ident, code: room.code }, planned, { rhythm, ...(begun && { join: { rhythm, anchorAt: g.startsAt } }) });
    navigate(`/room/${encodeURIComponent(room.ident)}`);
  };

  const bar = (
    <AppBar mode="back" title={g?.isOrganizer ? t('Organizing', 'Organisieren') : t('Gathering', 'Treffen')}
      onBack={() => (history.length > 1 ? navigate(-1) : navigate('/'))} style={{ position: 'sticky', top: 0, zIndex: 10 }} />
  );

  if (!api || !link || g === null || failed) {
    return (
      <>
        {bar}
        <EmptyState
          title={!api ? t('Gatherings need the online service', 'Treffen brauchen den Online-Dienst') : failed ? t("Couldn't load this gathering", 'Treffen konnte nicht geladen werden') : t("This gathering isn't here any more", 'Dieses Treffen gibt es nicht mehr')}
          hint={failed ? t('Check your connection and try again.', 'Prüfe deine Verbindung und versuche es erneut.') : t('It may have ended, or the link is incomplete.', 'Es ist vielleicht vorbei, oder der Link ist unvollständig.')}
        />
      </>
    );
  }
  if (g === undefined) return <>{bar}<Spinner /></>;

  const state = tableState(g, new Date());
  const open = state !== 'cancelled' && state !== 'ended' && g.org.verified;
  const full = g.going >= g.capacity;
  const labels = kindLabels(t);
  const code = g.roomCode ?? room?.code ?? '';

  const tag = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      {state === 'cancelled' ? <TableTag tone="alert">{t(`Cancelled by ${g.org.name}`, `Von ${g.org.name} abgesagt`)}</TableTag>
        : !g.org.verified ? <TableTag tone="alert">{t('No longer verified', 'Nicht mehr verifiziert')}</TableTag>
        : state === 'ended' ? <TableTag tone="info">{t('This gathering has ended', 'Dieses Treffen ist vorbei')}</TableTag>
        : full ? <TableTag tone="info">{t('Full', 'Voll')}</TableTag>
        : <TableTag tone="focus">{labels[g.kind]}</TableTag>}
      <VerifiedTag name={g.org.name} verified={g.org.verified} verifiedLabel={t('Verified', 'Verifiziert')} onClick={() => navigate(`/o/${g.org.slug}`)} />
    </div>
  );

  const hall = (
    <Hall kind={g.kind} capacity={g.capacity} replies={g.replies} code={code.replace(/\s+/g, '')} width={wide ? 480 : 296}
      cancelled={!open && state !== 'ended'} title={hallTitle(g, t)} />
  );

  const where = open
    ? `${code} · ${t(`${g.capacity} seats`, `${g.capacity} Plätze`)} · ${t('room approved by THD', 'Raum von der THD freigegeben')}${g.kind === 'focus' ? ` · ${t('50 min focus, 10 min break', '50 Min. Fokus, 10 Min. Pause')}` : ''}`
    : code;
  const who = open && g.going + g.maybe + g.waiting > 0
    ? g.myAnswer === 'going'
      ? (g.going <= 1
          ? t("You're the first", 'Du bist die erste Zusage')
          : t(`You and ${g.going - 1} ${g.going === 2 ? 'other' : 'others'}`, `Du und ${g.going - 1} weitere`)) +
        (g.maybe ? t(` · ${g.maybe} maybe`, ` · ${g.maybe} vielleicht`) : '')
      : countLine(g, t)
    : undefined;

  const replyText = {
    seat: t('Going', 'Ich komme'),
    maybe: t('Maybe', 'Vielleicht'),
    cant: t("Can't", 'Kann nicht'),
    cantLong: t("Can't make it", 'Kann nicht'),
    seated: t("You're going", 'Du kommst'),
    maybeStatus: t('You said maybe', 'Du hast vielleicht gesagt'),
    full: t('Join the waiting list', 'Auf die Warteliste'),
  };
  const counts = people ? programmeCounts(people) : null;
  const centred = { width: wide ? undefined : '100%', alignSelf: wide ? 'flex-start' : undefined } as CSSProperties;

  const actions = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {open && g.kind === 'focus' && (state === 'soon' || state === 'live') && g.myAnswer === 'going' && room && (
        <Button variant="filled" size="large" onClick={() => void startFocus()} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', ...centred }}>
          {t(`Start focus in ${room.code}`, `Fokus in ${room.code} starten`)}
        </Button>
      )}
      {open && !g.isOrganizer && g.myAnswer !== 'waiting' && (
        full && !g.myAnswer ? (
          <Button variant="filled" size="large" disabled={busy} onClick={() => void reply('going')} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', ...centred }}>
            {replyText.full}
          </Button>
        ) : (
          <ReplyBar
            answer={g.myAnswer === 'going' ? 'seat' : g.myAnswer === 'maybe' ? 'maybe' : null}
            full={full && g.myAnswer !== 'going'}
            busy={busy}
            onReply={(a) => void reply(a === 'seat' ? 'going' : a)}
            text={replyText}
            inline={wide}
          />
        )
      )}
      {open && g.myAnswer === 'waiting' && (
        <div style={row}>
          <span role="status" style={{ flex: 1, fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>
            {t(`You're number ${g.waitingPlace ?? 1} on the waiting list`, `Du bist Nummer ${g.waitingPlace ?? 1} auf der Warteliste`)}
          </span>
          <Button variant="text" disabled={busy} onClick={() => void reply('no')}>{t("Can't", 'Kann nicht')}</Button>
        </div>
      )}
      {g.isOrganizer && counts && g.going + g.maybe === 0 && (
        <div style={list}>
          <div style={line}>
            <span style={{ flex: 1, ...fine, fontSize: 'var(--body-medium-size)' }}>{t('No replies yet. Share the link to get it going.', 'Noch keine Antworten. Teile den Link.')}</span>
          </div>
        </div>
      )}
      {g.isOrganizer && counts && g.going + g.maybe > 0 && (
        <div style={list}>
          <div style={line}>
            <span style={{ flex: 1 }}>
              <b style={{ display: 'block', fontWeight: 500 }}>{t(`Plan for about ${planFor(g.going, g.maybe)}`, `Plane mit etwa ${planFor(g.going, g.maybe)}`)}</b>
              <span style={fine}>{t('Everyone going and half the maybes', 'Alle, die kommen, und die Hälfte der Vielleichts')}</span>
            </span>
          </div>
          <div style={{ ...line, borderTop: '1px solid var(--md-outline-variant)' }}>
            <span style={{ flex: 1 }}>
              <b style={{ display: 'block', fontWeight: 500 }}>{counts.shown.length ? counts.shown.map(([p, n]) => `${p || t('No programme given', 'Ohne Studiengang')} ${n}`).join(' · ') : t('No replies yet', 'Noch keine Antworten')}</b>
              {counts.others > 0 && <span style={fine}>{t(`and ${counts.others} from ${counts.otherProgrammes} other programmes`, `und ${counts.others} aus ${counts.otherProgrammes} weiteren Studiengängen`)}</span>}
            </span>
            <Button variant="text" onClick={() => setShowPeople(true)}>{t('People', 'Personen')}</Button>
          </div>
        </div>
      )}
      {open && (g.isOrganizer || g.myAnswer) && (
        <div style={row}>
          <Button variant="tonal" icon={<IconShare size={18} />} onClick={share}>{t('Share link', 'Link teilen')}</Button>
          {g.isOrganizer && <Button variant="text" onClick={exportCsv} disabled={!people?.length}>{t('Export', 'Exportieren')}</Button>}
          {g.isOrganizer && room && <Button variant="text" onClick={() => setEditing(true)}>{t('Change', 'Ändern')}</Button>}
          {g.isOrganizer && <Button variant="text" onClick={() => setCancelling(true)}>{t('Cancel', 'Absagen')}</Button>}
        </div>
      )}
      {open && !g.isOrganizer && !g.myAnswer && (
        <p style={fine}>{t(`Replying shares your name, programme and batch with ${g.org.name}.`, `Wenn du antwortest, sieht ${g.org.name} deinen Namen, Studiengang und Jahrgang.`)}</p>
      )}
      {!open && (
        <Button variant="tonal" onClick={() => navigate('/')} style={centred}>{t('Find a free room', 'Freien Raum finden')}</Button>
      )}
    </div>
  );

  return (
    <>
      {bar}
      <Page style={wide ? { maxWidth: 1040 } : undefined}>
        <StudyTableCard ring={hall} tag={tag} topic={g.title} when={tableWhen(g.startsAt, g.endsAt, locale, new Date())} where={where} who={who} muted={!open} wide={wide}>
          {actions}
        </StudyTableCard>
        {!wide && actions}
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
      {room && g.isOrganizer && (
        <GatheringSheet open={editing} room={room} gathering={g} onClose={() => setEditing(false)}
          onSaved={(saved) => { setG(saved); setEditing(false); setSnack(t('Gathering changed', 'Treffen geändert')); }} />
      )}
      {people && <PeopleSheet open={showPeople} onClose={() => setShowPeople(false)} people={people} title={g.title} />}
      <ConfirmDialog
        open={cancelling}
        title={t('Cancel this gathering?', 'Dieses Treffen absagen?')}
        body={t('Everyone with the link sees it as cancelled.', 'Alle mit dem Link sehen es als abgesagt.')}
        confirmLabel={t('Cancel gathering', 'Treffen absagen')}
        cancelLabel={t('Keep it', 'Behalten')}
        onConfirm={cancel}
        onCancel={() => setCancelling(false)}
      />
      <Snackbar message={snack} onClose={() => setSnack('')} bottom={wide ? 24 : 96} />
    </>
  );
}
