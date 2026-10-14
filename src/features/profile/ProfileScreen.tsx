import { useNavigate } from 'react-router-dom';
import { FocusGraph, ProfileHeader } from '../../components';
import { dayKey } from '../../components/focus/FocusGraph';
import { useI18n } from '../../i18n';
import { useWindowClass } from '../../lib/useWindowClass';
import { BrandHeader } from '../shared/BrandHeader';
import { Page } from '../shared/ui';
import { graphText } from '../focus/copy';
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

  const stats = t(
    'No focus yet. Start a session in any free room.',
    'Noch kein Fokus. Starte eine Session in einem freien Raum.',
  );

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
          days={[]}
          today={dayKey(new Date())}
          weeks={53}
          compact={compact}
          stats={stats}
          label={`${t('Focus graph', 'Fokus-Verlauf')}. ${stats}`}
          text={graphText(t, locale)}
        />
        <SavedRooms grid={cls === 'expanded'} />
      </Page>
    </>
  );
}
