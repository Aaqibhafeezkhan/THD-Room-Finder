import { useNavigate } from 'react-router-dom';
import { AppBar, FocusPill } from '../../components';
import { useI18n } from '../../i18n';
import { useFocusSession } from '../focus/FocusSessionContext';
import { sessionView } from '../focus/sessionView';
import { OverflowMenu } from './OverflowMenu';

const stickyBar = { position: 'sticky' as const, top: 0, zIndex: 10 };

/**
 * Brand app bar shared by the top-level tabs. Settings (theme + language) live
 * behind a single icon menu on the right, keeping the bar minimal. Profile
 * passes `menu={false}`: its own header carries the gear.
 */
export function BrandHeader({ title, menu = true }: { title?: string; menu?: boolean }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { active, plan, status, now } = useFocusSession();
  // A running session shows as a pill on every tab (D1), opening its room:
  // the time left in the block or break, or "Break's over".
  const view = active && plan && status ? sessionView(active, plan, status, now, t) : null;
  return (
    <AppBar
      title={title}
      style={stickyBar}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: '0.25rem' }}>
          {active && view && (
            <FocusPill
              elapsed={view.clock}
              phase={view.phase}
              room={active.roomCode}
              label={t(
                `${view.title} in ${active.roomCode}, ${view.clockLabel}. Open room.`,
                `${view.title} in ${active.roomCode}, ${view.clockLabel}. Raum öffnen.`,
              )}
              onOpen={() => navigate(`/room/${encodeURIComponent(active.roomIdent)}`)}
            />
          )}
          {menu && <OverflowMenu />}
        </div>
      }
    />
  );
}
