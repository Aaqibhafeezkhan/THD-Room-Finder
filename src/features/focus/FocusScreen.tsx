import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, FocusStartCard, FocusSummary, FocusSurface, OnCampusCard } from '../../components';
import { IconMute, IconSound, IconTimer } from '../../components/focus/focusIcons';
import { focusNotifier } from '../../data/focusNotifier';
import { soundPlayer } from '../../data/focusSounds';
import { formatTime } from '../../domain/format';
import { getCampusHours } from '../../domain/openingHours';
import type { Rhythm } from '../../domain/focusRhythm';
import { campusNow } from '../../domain/time';
import { useI18n } from '../../i18n';
import { useWindowClass } from '../../lib/useWindowClass';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { useRoomData } from '../rooms/RoomDataContext';
import { BrandHeader } from '../shared/BrandHeader';
import { Page } from '../shared/ui';
import { formatMinutes } from './copy';
import { isHome, useFocusSession } from './FocusSessionContext';
import { RhythmSheet } from './RhythmSheet';
import { useRhythmPreference } from './rhythmPreference';
import { useSoundsLocked } from './FocusSounds';
import { SoundSheet } from './SoundSheet';
import { soundName, useSoundPreference } from './soundPreference';
import { rhythmLine, rhythmName, sessionView } from './sessionView';
import { useFocusStats } from './useFocusStats';

/**
 * The Focus tab (ADR 0011): where focus at home starts, and where any running
 * session lives. Nothing running: the At home card, the On campus card that
 * leads to Rooms, and today's minutes. Running: the focus surface with its
 * place; a room session links back to its room, where Private/Public and
 * Study together stay. Just ended: the summary over the start card.
 */
export function FocusScreen() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cls = useWindowClass();
  const focus = useFocusSession();
  const profile = useStudyProfile();
  const stats = useFocusStats();
  const [preferred] = useRhythmPreference();
  const [picked, setPicked] = useState<Rhythm | null>(null);
  const [picking, setPicking] = useState(false);
  const rhythm = picked ?? preferred;
  const wide = cls !== 'compact';
  const [sounds, setSound] = useSoundPreference();
  const [pickingSound, setPickingSound] = useState(false);
  const locked = useSoundsLocked();

  const active = focus.active;
  const view = active && focus.plan && focus.status ? sessionView(active, focus.plan, focus.status, focus.now, t) : null;
  const ended = !active ? focus.lastEnded : null;

  let body;
  if (active && view) {
    const home = isHome(active);
    const batch = profile.batch;
    body = (
      <FocusSurface
        place={{ home, label: home ? t('At home', 'Zu Hause') : active.roomCode }}
        large={wide}
        elapsed={view.clock}
        elapsedLabel={view.clockLabel}
        phase={view.phase}
        phaseLabel={view.blockLabel ?? undefined}
        track={view.track}
        confirmLabel={view.confirmLabel}
        onConfirm={() => void focus.confirm()}
        plannedLine={view.line}
        tip={view.tip}
        sound={{
          on: !active.muted,
          label: active.muted ? t('Sounds off for this session', 'Töne für diese Session aus') : t('Sounds on for this session', 'Töne für diese Session an'),
          onToggle: () => focus.setMuted(!active.muted),
        }}
        soundHint={locked ? t('Tap anywhere to turn sounds back on.', 'Tippe irgendwo, um die Töne wieder einzuschalten.') : undefined}
        note={
          home
            ? t('Only you see this session.', 'Nur du siehst diese Session.')
            : !active.shared
              ? t("On this device only; the room isn't claimed.", 'Nur auf diesem Gerät; der Raum wird nicht belegt.')
              : active.visibility === 'public' && batch
                ? t(`Public · ${batch} sees you here and can join.`, `Öffentlich · ${batch} sieht dich hier und kann beitreten.`)
                : t('Private · others see that someone is focusing here, not who.', 'Privat · Andere sehen, dass hier jemand lernt, aber nicht wer.')
        }
        action={
          home ? undefined : (
            <Button
              variant="text"
              size="small"
              onClick={() => navigate(`/room/${encodeURIComponent(active.roomIdent)}`)}
              style={{ color: 'var(--md-on-focus-container)' }}
            >
              {t(`Open ${active.roomCode}`, `${active.roomCode} öffnen`)}
            </Button>
          )
        }
        visibility={active.visibility}
        showName={active.showName}
        signedIn={Boolean(active.shared)}
        text={{
          title: view.title,
          private: '',
          public: '',
          visibility: '',
          explainPrivate: '',
          explainPublic: '',
          showName: '',
          nameSub: '',
          lockedNote: t(
            'Keeps running when your phone is locked. After each break, tap to start the next block.',
            'Läuft weiter, wenn dein Handy gesperrt ist. Nach jeder Pause tippst du, um den nächsten Block zu starten.',
          ),
          end: t('End', 'Beenden'),
          signedOut: '',
          setup: '',
        }}
        onEnd={() => void focus.end()}
      />
    );
  } else {
    body = (
      <>
        {ended && (
          <FocusSummary
            title={t('Session ended', 'Session beendet')}
            added={formatMinutes(ended.minutes, locale)}
            addedLabel={
              (ended.blocks > 1
                ? t(`of focus in ${ended.blocks} blocks, added to your focus graph`, `Fokus in ${ended.blocks} Blöcken, zu deinem Fokus-Verlauf hinzugefügt`)
                : t('of focus, added to your focus graph', 'Fokus, zu deinem Fokus-Verlauf hinzugefügt')) +
              (ended.awayMinutes > 0
                ? t(` · ${formatMinutes(ended.awayMinutes, 'en')} in other apps left out`, ` · ${formatMinutes(ended.awayMinutes, 'de')} in anderen Apps nicht gezählt`)
                : '')
            }
            todayLine={t(
              `Today ${formatMinutes(stats.todayMinutes, 'en')} · ${stats.streak}-day streak`,
              `Heute ${formatMinutes(stats.todayMinutes, 'de')} · ${stats.streak} Tage in Folge`,
            )}
            viewGraphLabel={t('View Focus Graph', 'Fokus-Verlauf ansehen')}
            onViewGraph={() => navigate('/profile')}
          />
        )}
        <FocusStartCard
          title={t('At home', 'Zu Hause')}
          line={t('Only you see it. It counts in your focus graph.', 'Nur du siehst sie. Sie zählt in deinem Fokus-Verlauf.')}
          startLabel={t('Start focus at home', 'Fokus zu Hause starten')}
          onStart={() => void startHome()}
          choices={[
            {
              icon: <IconTimer size={16} />,
              strong: rhythmName(rhythm, t),
              rest: rhythmLine(rhythm, t),
              changeLabel: t('Change', 'Ändern'),
              onChange: () => setPicking(true),
            },
            {
              icon: sounds.home === 'silent' ? <IconMute size={16} /> : <IconSound size={16} />,
              strong: soundName(sounds.home, t),
              changeLabel: t('Change', 'Ändern'),
              onChange: () => setPickingSound(true),
            },
          ]}
        />
        <CampusLine onRooms={() => navigate('/rooms')} />
        {!ended && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              {stats.todayMinutes > 0 ? (
                <>
                  {t('Today', 'Heute')}{' '}
                  <strong style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>{formatMinutes(stats.todayMinutes, locale)}</strong>
                </>
              ) : (
                t('No focus yet today', 'Heute noch kein Fokus')
              )}
              {stats.streak > 0 &&
                ` · ${stats.streak === 1 ? t('1-day streak', '1 Tag in Folge') : t(`${stats.streak}-day streak`, `${stats.streak} Tage in Folge`)}`}
            </span>
            <Button variant="text" size="small" onClick={() => navigate('/profile')}>
              {t('View focus graph', 'Fokus-Verlauf ansehen')}
            </Button>
          </div>
        )}
      </>
    );
  }

  async function startHome() {
    // The tap unlocks audio, so the first break can sound (ADR 0012).
    soundPlayer().unlock();
    // Asked on the first Start, like in a room (ADR 0004 §7); declining never
    // blocks focusing.
    const notifier = focusNotifier();
    void notifier
      .permission()
      .then((p) => (p === 'prompt' ? notifier.request() : p))
      .catch(() => undefined);
    await focus.startHome({ rhythm });
  }

  return (
    <>
      <BrandHeader title={t('Focus', 'Fokus')} menu={false} pill={false} />
      {/* The surface is 560 px at most, centred on wide windows. */}
      <Page style={{ maxWidth: 592 }}>
        {body}
      </Page>
      <RhythmSheet
        open={picking}
        title={t('Rhythm for this session', 'Rhythmus für diese Session')}
        value={rhythm}
        onClose={() => setPicking(false)}
        onPick={setPicked}
      />
      <SoundSheet open={pickingSound} place="home" value={sounds.home} onClose={() => setPickingSound(false)} onPick={(s) => setSound('home', s)} />
    </>
  );
}

/** The On campus card: what the room finder would say right now. */
function CampusLine({ onRooms }: { onRooms: () => void }) {
  const { t, locale } = useI18n();
  const { freeRooms, schedule, isCustomTime, loading } = useRoomData();
  const [now, setNow] = useState(campusNow);
  useEffect(() => {
    const id = window.setInterval(() => setNow(campusNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const hours = getCampusHours(now);
  let line;
  if (hours.access === 'unconfirmed') {
    line = t('Classroom access unconfirmed', 'Zugang zu Lehrräumen unbestätigt');
  } else if (!hours.open) {
    const next = hours.nextOpen;
    const sameDay = next && next.toDateString() === now.toDateString();
    const when = !next
      ? ''
      : sameDay
        ? formatTime(next)
        : `${new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { weekday: 'short' }).format(next)} ${formatTime(next)}`;
    line = next
      ? t(`Classroom buildings closed · opens ${when}`, `Lehrgebäude geschlossen · öffnet ${when}`)
      : t('Classroom buildings closed', 'Lehrgebäude geschlossen');
  } else if (isCustomTime) {
    line = t('Classroom buildings are open', 'Lehrgebäude sind geöffnet');
  } else if (schedule === 'unavailable') {
    line = t('Free rooms unknown right now', 'Freie Räume gerade unbekannt');
  } else if (loading) {
    line = t('Checking rooms…', 'Räume werden geprüft…');
  } else {
    const n = freeRooms.length;
    line = (
      <>
        <span style={{ color: 'var(--md-tertiary)', fontWeight: 500 }}>
          {n === 1 ? t('1 room free', '1 Raum frei') : t(`${n} rooms free`, `${n} Räume frei`)}
        </span>{' '}
        {t('now', 'jetzt')}
      </>
    );
  }
  return (
    <OnCampusCard
      title={t('On campus', 'Auf dem Campus')}
      line={line}
      actionLabel={hours.open ? t('Find a room', 'Raum finden') : t('Plan', 'Planen')}
      onAction={onRooms}
    />
  );
}
