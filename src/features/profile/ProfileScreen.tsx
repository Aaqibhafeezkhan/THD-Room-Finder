import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FocusGraph, ProfileHeader, Snackbar } from '../../components';
import { useI18n } from '../../i18n';
import { useWindowClass } from '../../lib/useWindowClass';
import { BrandHeader } from '../shared/BrandHeader';
import { Page } from '../shared/ui';
import { graphText, statsLine } from '../focus/copy';
import { ShareSheet } from '../focus/ShareSheet';
import { useFocusStats } from '../focus/useFocusStats';
import { SavedRooms } from './SavedRooms';

/**
 * Profile (D2): only what a student checks almost daily. A one-line header
 * (study profile or "Not signed in" with the gear), the focus graph and the
 * saved rooms. Settings sit behind the gear. Signed out, the graph (local) and
 * saved rooms still work.
 */
export function ProfileScreen() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const cls = useWindowClass();
  const compact = cls === 'compact';
  const focus = useFocusStats();
  const [sharing, setSharing] = useState(false);
  const [snack, setSnack] = useState('');

  const stats = statsLine(t, locale, focus.semesterMinutes, focus.streak);

  return (
    <>
      <BrandHeader title={t('Profile', 'Profil')} menu={false} />
      <Page style={{ maxWidth: compact ? 640 : 960 }}>
        <ProfileHeader
          signedIn={false}
          notSignedIn={t('Not signed in', 'Nicht angemeldet')}
          setupLabel={t('Set Up Study Profile', 'Studienprofil einrichten')}
          settingsLabel={t('Settings', 'Einstellungen')}
          onSetup={() => navigate('/profile/settings')}
          onSettings={() => navigate('/profile/settings')}
        />
        <FocusGraph
          days={focus.days}
          today={focus.today}
          weeks={53}
          compact={compact}
          stats={stats}
          label={`${t('Focus graph', 'Fokus-Verlauf')}. ${stats}`}
          text={graphText(t, locale)}
          onShare={focus.hasHistory ? () => setSharing(true) : undefined}
        />
        <SavedRooms grid={cls === 'expanded'} />
      </Page>
      <ShareSheet open={sharing} onClose={() => setSharing(false)} onDone={setSnack} />
      <Snackbar message={snack} onClose={() => setSnack('')} bottom={compact ? 96 : 24} />
    </>
  );
}
