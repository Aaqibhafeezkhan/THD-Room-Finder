import { useNavigate } from 'react-router-dom';
import { AppBar, FocusPill } from '../../components';
import { useI18n } from '../../i18n';
import { isHome, useFocusSession } from '../focus/FocusSessionContext';
import { sessionView } from '../focus/sessionView';
import { OverflowMenu } from './OverflowMenu';

const stickyBar = { position: 'sticky' as const, top: 0, zIndex: 10 };

/**
 * Brand app bar shared by the top-level tabs. Settings (theme + language) live
 * behind a single icon menu on the right, keeping the bar minimal. Profile
 * passes `menu={false}`: its own header carries the gear. Focus passes
 * `pill={false}`: the session itself is on that page.
 */
export function BrandHeader({ title, menu = true, pill = true }: { title?: string; menu?: boolean; pill?: boolean }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { active, plan, status, now } = useFocusSession();
  // A running session shows as a pill on every tab (D1), opening its room
  // (or Focus, at home): the time left in the block or break, or "Break's over".
  const view = active && plan && status ? sessionView(active, plan, status, now, t) : null;
  const home = isHome(active);
  const where = home ? t('At home', 'Zu Hause') : (active?.roomCode ?? '');
  return (
    <AppBar
      title={title}
      style={stickyBar}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: '0.25rem' }}>
          {pill && active && view && (
            <FocusPill
              elapsed={view.clock}
              phase={view.phase}
              room={where}
              home={home}
              label={
                home
                  ? t(`${view.title} at home, ${view.clockLabel}. Open Focus.`, `${view.title} zu Hause, ${view.clockLabel}. Fokus öffnen.`)
                  : t(`${view.title} in ${where}, ${view.clockLabel}. Open room.`, `${view.title} in ${where}, ${view.clockLabel}. Raum öffnen.`)
              }
              onOpen={() => navigate(home ? '/focus' : `/room/${encodeURIComponent(active.roomIdent)}`)}
            />
          )}
          {menu && <OverflowMenu />}
        </div>
      }
    />
  );
}
