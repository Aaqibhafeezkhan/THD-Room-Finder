import { useNavigate } from 'react-router-dom';
import { AppBar, FocusPill } from '../../components';
import { formatElapsed } from '../../domain/focusSession';
import { useI18n } from '../../i18n';
import { useFocusSession } from '../focus/FocusSessionContext';
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
  const { active, now } = useFocusSession();
  // A running session shows as a pill on every tab (D1), opening its room.
  const elapsed = active ? formatElapsed(now.getTime() - new Date(active.startedAt).getTime()) : '';
  return (
    <AppBar
      title={title}
      style={stickyBar}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: '0.25rem' }}>
          {active && (
            <FocusPill
              elapsed={elapsed}
              room={active.roomCode}
              label={t(
                `Focus session in ${active.roomCode}, ${elapsed}. Open room.`,
                `Fokus-Session in ${active.roomCode}, ${elapsed}. Raum öffnen.`,
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
