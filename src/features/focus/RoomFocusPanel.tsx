import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityRow, FocusButton, FocusSummary, FocusSurface, Snackbar } from '../../components';
import type { FocusSurfaceText } from '../../components';
import { roomKey } from '../../data/focusApi';
import { ServiceError } from '../../data/identityApi';
import { formatTime } from '../../domain/format';
import { formatElapsed, planEnd } from '../../domain/focusSession';
import type { Room, RoomAvailability } from '../../domain/models';
import { useI18n } from '../../i18n';
import { useWindowClass } from '../../lib/useWindowClass';
import { SetupSheet } from '../profile/SetupSheet';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { formatMinutes } from './copy';
import { useFocusSession } from './FocusSessionContext';
import { useFocusStats } from './useFocusStats';

/**
 * The focus part of room detail (D1): who is focusing here, then Start focus,
 * the running session, or the summary right after one ended. Hidden during a
 * lecture, while the campus is closed and when looking at another time
 * (schedule only); a claim is never a booking, so Start stays available in a
 * claimed room.
 */
export interface RoomFocusPanelProps {
  room: Room;
  availability: RoomAvailability;
  closing: Date | null;
  /** Campus closed, or a picked time instead of now. */
  scheduleOnly: boolean;
}

export function RoomFocusPanel({ room, availability, closing, scheduleOnly }: RoomFocusPanelProps) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const cls = useWindowClass();
  const focus = useFocusSession();
  const profile = useStudyProfile();
  const stats = useFocusStats();
  const [setup, setSetup] = useState(false);
  const [snack, setSnack] = useState('');

  if (scheduleOnly) return null;

  const here = focus.active?.roomIdent === room.ident ? focus.active : null;
  const summary = focus.summaries?.get(roomKey(room.ident));
  const signedIn = Boolean(profile.email && profile.identity);
  const batch = profile.batch;
  const lecture = availability.status === 'occupied';
  const now = new Date();

  const fail = (e: unknown) => {
    const code = e instanceof ServiceError ? e.code : '';
    setSnack(
      code === 'network'
        ? t("You're offline. Try again in a moment.", 'Du bist offline. Versuche es gleich noch einmal.')
        : t("Couldn't update the session. Try again.", 'Session konnte nicht aktualisiert werden. Versuche es erneut.'),
    );
  };

  const startHere = async (visibility?: 'private' | 'public') => {
    const plan = planEnd(new Date(), availability.freeUntil, closing);
    if (!plan) {
      setSnack(t('Less than a minute until the next lecture.', 'Weniger als eine Minute bis zur nächsten Vorlesung.'));
      return;
    }
    await focus.start({ ident: room.ident, code: room.code }, plan, visibility);
  };

  // ── Who else is here ───────────────────────────────────────────────────
  let activity = null;
  if (focus.summaries === null) {
    activity = (
      <ActivityRow
        kind="unknown"
        title={t('Focus activity unknown', 'Fokus-Aktivität unbekannt')}
        sub={t(
          'A session you start still runs on this device.',
          'Eine gestartete Session läuft trotzdem auf diesem Gerät.',
        )}
      />
    );
  } else if (summary && summary.batchCount > 0 && batch) {
    const n = summary.batchCount;
    const names = summary.batchNames.length ? ` · ${summary.batchNames.join(', ')}` : '';
    activity = (
      <ActivityRow
        kind="batch"
        title={t(`${batch} · ${n} studying${names}`, `${batch} · ${n} ${n === 1 ? 'lernt' : 'lernen'} hier${names}`)}
        sub={
          summary.batchSince
            ? t(`Public sessions · since ${formatTime(summary.batchSince)}`, `Öffentliche Sessions · seit ${formatTime(summary.batchSince)}`)
            : undefined
        }
        action={
          !here && !lecture ? (
            <FocusButton tone="join" onClick={() => startHere('public')}>
              {t('Join', 'Beitreten')}
            </FocusButton>
          ) : undefined
        }
      />
    );
  } else if (summary && summary.claims > 0) {
    const mins = summary.claimSince ? Math.max(1, Math.round((now.getTime() - summary.claimSince.getTime()) / 60000)) : null;
    activity = (
      <ActivityRow
        kind="claimed"
        title={
          mins
            ? t(`Focus session · started ${formatMinutes(mins, 'en')} ago`, `Fokus-Session · seit ${formatMinutes(mins, 'de')}`)
            : t('Focus session', 'Fokus-Session')
        }
        sub={t(
          'Someone is studying here. A claim is not a booking, so you can still focus here.',
          'Hier lernt gerade jemand. Eine Fokus-Session ist keine Buchung – du kannst hier trotzdem lernen.',
        )}
      />
    );
  }

  // ── The running session ────────────────────────────────────────────────
  let body = null;
  if (here) {
    const plannedEnd = new Date(here.plannedEnd);
    const until =
      here.reason === 'lecture'
        ? t(`before the ${formatTime(plannedEnd)} lecture`, `vor der Vorlesung um ${formatTime(plannedEnd)}`)
        : here.reason === 'closing'
          ? t('when the campus closes', 'wenn der Campus schließt')
          : t('3 h max', 'max. 3 Std.');
    const elapsedMs = focus.now.getTime() - new Date(here.startedAt).getTime();
    const shareText: FocusSurfaceText = {
      title: t('Focus session', 'Fokus-Session'),
      private: t('Private', 'Privat'),
      public: batch ? t(`Public · ${batch}`, `Öffentlich · ${batch}`) : t('Public', 'Öffentlich'),
      visibility: t('Who sees this session', 'Wer diese Session sieht'),
      explainPrivate: t('Others see that someone is focusing here, not who.', 'Andere sehen, dass hier jemand lernt – aber nicht wer.'),
      explainPublic: t(
        `${batch} sees you here and can join. Everyone else sees a focus session.`,
        `${batch} sieht dich hier und kann beitreten. Alle anderen sehen nur eine Fokus-Session.`,
      ),
      showName: t('Show my name', 'Meinen Namen zeigen'),
      nameSub:
        here.showName && profile.identity?.displayName
          ? t(`Shown as ${profile.identity.displayName}`, `Angezeigt als ${profile.identity.displayName}`)
          : t(`Shown as "${batch} student"`, `Angezeigt als „Studi aus ${batch}"`),
      lockedNote: t(
        'Keeps running when your phone is locked. We check in about once an hour.',
        'Läuft weiter, wenn dein Handy gesperrt ist. Etwa stündlich fragen wir kurz nach.',
      ),
      end: t('End', 'Beenden'),
      signedOut: t(
        "Only you see this timer; the room doesn't show as claimed. Set up a study profile to share sessions with your batch.",
        'Nur du siehst diesen Timer; der Raum wird nicht als belegt angezeigt. Richte ein Studienprofil ein, um Sessions mit deinem Jahrgang zu teilen.',
      ),
      setup: t('Set Up Study Profile', 'Studienprofil einrichten'),
    };
    const sharedHere = Boolean(here.shared);
    body = (
      <>
        <FocusSurface
          elapsed={formatElapsed(elapsedMs)}
          elapsedLabel={t(
            `${Math.floor(elapsedMs / 60000)} minutes focused`,
            `${Math.floor(elapsedMs / 60000)} Minuten fokussiert`,
          )}
          plannedLine={t(`Planned end ${formatTime(plannedEnd)} · ${until}`, `Geplantes Ende ${formatTime(plannedEnd)} · ${until}`)}
          visibility={here.visibility}
          showName={here.showName}
          signedIn={sharedHere}
          text={shareText}
          onVisibility={(v) => {
            if (v === 'public' && !batch) {
              setSetup(true);
              return;
            }
            focus.setVisibility(v).catch(fail);
          }}
          onShowName={(on) => focus.setShowName(on).catch(fail)}
          onEnd={() => void focus.end()}
          onSetup={profile.available ? () => setSetup(true) : undefined}
        />
        {here.localBecause && signedIn && (
          <p style={{ margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' }}>
            {here.localBecause === 'offline'
              ? t('Offline: this timer runs on your device and is not shared.', 'Offline: Dieser Timer läuft auf deinem Gerät und wird nicht geteilt.')
              : here.localBecause === 'unknown_room'
                ? t("This room can't be shared yet, so only you see this timer.", 'Dieser Raum kann noch nicht geteilt werden, daher siehst nur du diesen Timer.')
                : t("Sharing didn't work, so only you see this timer.", 'Teilen hat nicht geklappt, daher siehst nur du diesen Timer.')}
          </p>
        )}
      </>
    );
  } else if (lecture) {
    body = availability.occupiedUntil ? (
      <p style={{ margin: 0, fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>
        {t(
          `Focus sessions can't start during a lecture. Free again at ${formatTime(availability.occupiedUntil)}.`,
          `Während einer Vorlesung kannst du keinen Fokus starten. Ab ${formatTime(availability.occupiedUntil)} wieder frei.`,
        )}
      </p>
    ) : null;
  } else {
    const ended = focus.lastEnded?.roomIdent === room.ident ? focus.lastEnded : null;
    body = (
      <>
        {ended && (
          <FocusSummary
            title={t('Session ended', 'Session beendet')}
            added={formatMinutes(ended.minutes, locale)}
            addedLabel={t('added to your focus graph', 'zu deinem Fokus-Verlauf hinzugefügt')}
            todayLine={t(
              `Today ${formatMinutes(stats.todayMinutes, 'en')} · ${stats.streak}-day streak`,
              `Heute ${formatMinutes(stats.todayMinutes, 'de')} · ${stats.streak} Tage in Folge`,
            )}
            viewGraphLabel={t('View Focus Graph', 'Fokus-Verlauf ansehen')}
            onViewGraph={() => navigate('/profile')}
          />
        )}
        <FocusButton tone="start" fullWidth={cls === 'compact'} onClick={() => void startHere()}>
          {t('Start focus', 'Fokus starten')}
        </FocusButton>
        <p style={{ margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' }}>
          {focus.active
            ? t(`This ends your session in ${focus.active.roomCode}.`, `Damit endet deine Session in ${focus.active.roomCode}.`)
            : signedIn && profile.identity?.defaultVisibility === 'public'
              ? t('Public by default. Ends at the next lecture, after 3 h at most.', 'Standardmäßig öffentlich. Endet zur nächsten Vorlesung, spätestens nach 3 Std.')
              : t('Private by default. Ends at the next lecture, after 3 h at most.', 'Standardmäßig privat. Endet zur nächsten Vorlesung, spätestens nach 3 Std.')}
        </p>
      </>
    );
  }

  return (
    <section aria-label={t('Focus', 'Fokus')} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {activity}
      {body}
      <SetupSheet open={setup} onClose={() => setSetup(false)} onDone={setSnack} />
      <Snackbar message={snack} onClose={() => setSnack('')} bottom={cls === 'compact' ? 96 : 24} />
    </section>
  );
}
