import { AppBar } from '../../components';
import { OverflowMenu } from './OverflowMenu';

const stickyBar = { position: 'sticky' as const, top: 0, zIndex: 10 };

/**
 * Brand app bar shared by the top-level tabs. Settings (theme + language) live
 * behind a single icon menu on the right, keeping the bar minimal. Profile
 * passes `menu={false}`: its own header carries the gear.
 */
export function BrandHeader({ title, menu = true }: { title?: string; menu?: boolean }) {
  return (
    <AppBar
      title={title}
      style={stickyBar}
      actions={
        menu ? (
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.25rem' }}>
            <OverflowMenu />
          </div>
        ) : null
      }
    />
  );
}
