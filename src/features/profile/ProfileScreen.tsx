import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { Button, FocusGraph, ProfileHeader, Snackbar } from '../../components';
import { useI18n } from '../../i18n';
import { useTheme } from '../../lib/theme';
import { useWindowClass } from '../../lib/useWindowClass';
import { BrandHeader } from '../shared/BrandHeader';
import { Page } from '../shared/ui';
import { formatHours, graphText, statsLine } from '../focus/copy';
import { ShareSheet } from '../focus/ShareSheet';
import { inviteLink, PUBLIC_ORIGIN } from '../focus/shareSnapshot';
import { useFocusStats } from '../focus/useFocusStats';
import { SavedRooms } from './SavedRooms';
import { SetupSheet } from './SetupSheet';
import { useStudyProfile } from './StudyProfileContext';
import { getCampusHours, isFocusRestDay } from '../../domain/openingHours';
import { campusNow } from '../../domain/time';
import { accessReason } from '../shared/accessCopy';

/**
 * Profile (D2): only what a student checks almost daily. A one-line header
 * (study profile or "Not signed in" with the gear), the focus graph and the
 * saved rooms. Settings sit behind the gear. Signed out, the graph (local) and
 * saved rooms still work. Invite a friend shares a link to the app whose
 * preview is the light or dark banner, as this app is set.
 */
export function ProfileScreen() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const cls = useWindowClass();
  const compact = cls === 'compact';
  const [now, setNow] = useState(campusNow);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(campusNow()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const focus = useFocusStats(now);
  const hours = getCampusHours(now);
  const reason = accessReason(hours.reason, t);
  const restDay = isFocusRestDay(now);
  const accessStatus = hours.reason === 'weekend'
    ? t('Weekend · Streak paused', 'Wochenende · Lernserie pausiert')
    : hours.access === 'closed'
      ? t('Campus closed today · Streak paused', 'Campus heute geschlossen · Lernserie pausiert')
      : hours.access === 'unconfirmed'
        ? `${reason} · ${t('Check campus access', 'Campuszugang prüfen')}`
        : hours.open
          ? t('Classroom buildings are open today', 'Lehrgebäude sind heute geöffnet')
          : t('Outside classroom opening hours', 'Außerhalb der Gebäudeöffnungszeit');
  const [sharing, setSharing] = useState(false);
  const [snack, setSnack] = useState('');
  const [setup, setSetup] = useState(false);
  const profile = useStudyProfile();
  const signedIn = Boolean(profile.email && profile.identity);

  const stats = statsLine(t, locale, focus.semesterMinutes, focus.streak);
  const { theme } = useTheme();

  const invite = async () => {
    const dark =
      theme === 'dark' ||
      (theme === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);
    const origin = Capacitor.isNativePlatform() ? PUBLIC_ORIGIN : window.location.origin;
    const url = inviteLink(dark, locale === 'de' ? 'de' : 'en', origin);
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'THD Room Finder', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setSnack(t('Invite link copied', 'Einladungslink kopiert'));
    } catch (err) {
      // AbortError: the share sheet was closed.
      if ((err as Error).name !== 'AbortError') setSnack(t("Couldn't share the link", 'Link konnte nicht geteilt werden'));
    }
  };

  return (
    <>
      <BrandHeader title={t('Profile', 'Profil')} menu={false} />
      <Page style={{ maxWidth: 960 }}>
        <ProfileHeader
          signedIn={signedIn}
          name={profile.displayName ?? undefined}
          batch={profile.batch ?? undefined}
          batchLabel={profile.batch ? t(`Batch ${profile.batch}`, `Jahrgang ${profile.batch}`) : undefined}
          notSignedIn={profile.email ? t('No study profile yet', 'Noch kein Studienprofil') : t('Not signed in', 'Nicht angemeldet')}
          setupLabel={t('Set Up Study Profile', 'Studienprofil einrichten')}
          settingsLabel={t('Settings', 'Einstellungen')}
          onSetup={profile.available ? () => setSetup(true) : undefined}
          onSettings={() => navigate('/profile/settings')}
        />
        <FocusGraph
          days={focus.days}
          today={focus.today}
          weeks={53}
          compact={compact}
          stats={<>{focus.semesterMinutes ? formatHours(focus.semesterMinutes, locale) : t('0 h', '0 Std.')} <span className="thd-focus-period">{t('this semester', 'dieses Semester')}</span></>}
          secondaryStats={t(`${focus.streak} study days in a row`, `${focus.streak} Lerntage in Folge`)}
          status={
            <>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                {restDay || !hours.open
                  ? <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />
                  : <path d="M5 21V3h14v18M9 21V6l7-2v17M12 13h1" />}
              </svg>
              <span title={hours.access === 'unconfirmed'
                ? t('Classroom access is unconfirmed. Check THD notices before travelling.', 'Zugang zu Lehrräumen unbestätigt. Prüfe vor der Anfahrt die THD-Hinweise.')
                : undefined}>{accessStatus}</span>
            </>
          }
          label={`${t('Focus graph', 'Fokus-Verlauf')}. ${stats}`}
          text={graphText(t, locale)}
          onShare={focus.hasHistory ? () => setSharing(true) : undefined}
        />
        <SavedRooms grid={cls === 'expanded'} />
        <Button variant="text" onClick={invite} style={{ alignSelf: 'center', minHeight: 48 }}>
          {t('Invite a Friend', 'Freunde einladen')}
        </Button>
      </Page>
      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        onDone={setSnack}
        name={signedIn ? (profile.identity?.displayName ?? undefined) : undefined}
        batch={signedIn ? (profile.batch ?? undefined) : undefined}
      />
      <SetupSheet open={setup} onClose={() => setSetup(false)} onDone={setSnack} />
      <Snackbar message={snack} onClose={() => setSnack('')} bottom={compact ? 96 : 24} />
    </>
  );
}
