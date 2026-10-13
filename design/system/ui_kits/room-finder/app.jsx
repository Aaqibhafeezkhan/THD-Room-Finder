// THD Room Finder — responsive app shell (map-first).
// One app, three breakpoints, switchable from the specimen toolbar:
//   • Mobile   → Android device frame, tap-through (Home → Map → building → list → detail)
//   • Tablet   → split: navigation rail + 2.5D map + contextual side panel
//   • Desktop  → wide master-detail: drawer + map + room list + detail, all visible
// The toolbar also carries a light/dark toggle and a Material-3 "dynamic color"
// source-hue picker (Android 12+) that recolors the app's brand roles live.
const NS = window.THDRoomFinderDesignSystem_de229b;
const { AppBar, Button, AdaptiveNav, RoomCard } = NS;
const MODE_OPTS = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']];
const { RF_DATA, RF_Icon: Icon, RF_SponsorAction: SponsorAction, RF_LiveFooter: LiveFooter,
  RF_BuildingBadge: BuildingBadge, MapBody, HomeBody, RoomListBody, RoomDetailBody } = window;
const { NAMES, AVAIL, LABEL2KEY, availColor } = RF_DATA;

// ── Material 3 dynamic color: derive brand roles from a source hue ─────────
// Status roles (tertiary green = free, error red = occupied) stay fixed so the
// availability semantics + map tint never drift; only chrome/brand recolors.
const okl = (l, c, h) => `oklch(${l} ${c} ${h})`;
function dynamicVars(hue, dark) {
  if (hue == null) return {};
  return dark ? {
    '--md-primary': okl(0.82, 0.11, hue), '--md-on-primary': okl(0.30, 0.09, hue),
    '--md-primary-container': okl(0.42, 0.10, hue), '--md-on-primary-container': okl(0.90, 0.05, hue),
    '--md-secondary': okl(0.80, 0.03, hue), '--md-secondary-container': okl(0.38, 0.035, hue),
    '--md-on-secondary-container': okl(0.90, 0.025, hue),
  } : {
    '--md-primary': okl(0.50, 0.13, hue), '--md-on-primary': '#ffffff',
    '--md-primary-container': okl(0.90, 0.05, hue), '--md-on-primary-container': okl(0.25, 0.08, hue),
    '--md-secondary': okl(0.48, 0.035, hue), '--md-secondary-container': okl(0.90, 0.028, hue),
    '--md-on-secondary-container': okl(0.22, 0.03, hue),
  };
}
const SWATCHES = [
  { id: 'thd', label: 'THD Blue', dot: '#1565C0', hue: null },
  { id: 'violet', label: 'Wallpaper · Violet', dot: '#7E57C2', hue: 300 },
  { id: 'green', label: 'Wallpaper · Green', dot: '#2E7D5B', hue: 155 },
  { id: 'amber', label: 'Wallpaper · Amber', dot: '#B57A16', hue: 75 },
];
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Icon.home(24) },
  { id: 'map', label: 'Map', icon: Icon.map(24) },
  { id: 'rooms', label: 'Rooms', icon: Icon.rooms(24) },
];
// Mobile merges Home + Map into one screen, so it navigates Map ⇄ Rooms only.
const MOBILE_NAV = [
  { id: 'map', label: 'Map', icon: Icon.map(24) },
  { id: 'rooms', label: 'Rooms', icon: Icon.rooms(24) },
];

// ── specimen toolbar (chrome — not part of the app) ────────────────────────
function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, background: 'var(--md-surface-1)', border: '1px solid var(--md-outline-variant)', borderRadius: 999, padding: 3 }}>
      {options.map(([id, label]) => {
        const on = id === value;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            border: 'none', borderRadius: 999, cursor: 'pointer', padding: '6px 14px', font: '600 12px/1 var(--font-sans)',
            background: on ? 'var(--md-secondary-container)' : 'transparent',
            color: on ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}>{label}</button>
        );
      })}
    </div>
  );
}
function Toolbar({ device, setDevice, theme, setTheme, color, setColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', padding: '11px 20px',
      borderBottom: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--md-on-surface-variant)' }}>Responsive</span>
        <Seg value={device} onChange={setDevice} options={[['mobile', 'Mobile'], ['tablet', 'Tablet'], ['desktop', 'Desktop']]} />
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--md-on-surface-variant)' }}>Dynamic color</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {SWATCHES.map(s => {
              const on = s.id === color;
              return (
                <button key={s.id} title={s.label} onClick={() => setColor(s.id)} style={{
                  width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', background: s.dot,
                  border: on ? '2px solid var(--md-on-surface)' : '2px solid transparent',
                  outline: on ? '1px solid var(--md-outline-variant)' : 'none', outlineOffset: 2, padding: 0,
                }} />
              );
            })}
          </div>
        </div>
        <Seg value={theme} onChange={setTheme} options={[['light', 'Light'], ['dark', 'Dark']]} />
      </div>
    </div>
  );
}

// ── small shared header for tablet/desktop panels ──────────────────────────
function PanelHead({ title, sub, onBack, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--md-outline-variant)', flexShrink: 0 }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--md-on-surface-variant)', cursor: 'pointer', flexShrink: 0 }}>{Icon.back(20)}</button>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--md-on-surface)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {sub && <div style={{ fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
const scroller = { flex: 1, overflowY: 'auto', minHeight: 0 };

// ═══════════════════════ MOBILE ═══════════════════════════════════════════
// Mobile = a stacked "mobile version of tablet": an interactive 2.5D map on
// top drives the contextual list below. Tap a building → its free rooms appear
// immediately (no focus mode, no confirm step); tap a room → detail.
function MobileMain({ mode, setMode, sel, onSelect, onClear, onOpen }) {
  const p = sel ? NAMES[sel] : null;
  const a = sel ? (AVAIL[sel] || { free: 0, total: 0 }) : null;
  const rooms = sel ? RF_DATA.roomsForLabel(p.label).filter(r => r.isFree) : RF_DATA.FREE_ALL;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* top part — live, interactive square map */}
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: 'var(--radius-l)', overflow: 'hidden', boxShadow: 'var(--md-shadow-1)' }}>
          <MapBody mode={mode} sel={sel} onSelect={onSelect} overlaySelection={false} hint={false} />
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}><Seg value={mode} onChange={setMode} options={MODE_OPTS} /></div>
        </div>
      </div>
      {/* lower part — Home, or the selected building's summary */}
      <div>
        {sel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1rem 0.4rem' }}>
            <button onClick={onClear} aria-label="Back to all rooms" style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--md-surface-1)', color: 'var(--md-on-surface-variant)', cursor: 'pointer', flexShrink: 0 }}>{Icon.back(20)}</button>
            <BuildingBadge label={p.label} color={availColor(a)} size={40} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--md-on-surface)', lineHeight: 1.2, textWrap: 'balance' }}>{p.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', marginTop: 2 }}><b style={{ color: 'var(--md-on-surface)', fontVariantNumeric: 'tabular-nums' }}>{a.free}</b> of {a.total} rooms free</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.4rem 1.25rem 0', textAlign: 'center' }}>
            <div style={{ fontSize: '4.5rem', fontWeight: 300, lineHeight: 1, color: 'var(--md-primary)', fontVariantNumeric: 'tabular-nums' }}>{RF_DATA.TOTAL_FREE}</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--md-on-surface)' }}>rooms free right now</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--md-on-surface-variant)', marginTop: '0.25rem' }}>across {RF_DATA.BUILDING_COUNT} buildings · {RF_DATA.TOTAL_ROOMS} rooms total</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--md-on-surface-variant)', marginTop: '0.9rem', textWrap: 'balance' }}>Tap a building on the map to see its free rooms, or scroll the list below.</div>
            <LiveFooter pad="0.9rem 0 0" />
          </div>
        )}
      </div>
      {/* scroll down — the rooms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.9rem 1rem 1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--md-on-surface-variant)', padding: '0 0.25rem 0.15rem' }}>{sel ? 'Free rooms' : 'Longest free right now'}</div>
        {rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--md-on-surface-variant)', fontSize: '0.875rem', background: 'var(--md-surface-1)', borderRadius: 'var(--radius-l)', textWrap: 'pretty' }}>No free rooms here right now. Pick another building on the map.</div>
        ) : rooms.map(r => (
          <RoomCard key={r.ident} name={r.name} meta={`${r.building} · ${r.seats} seats`}
            status={r.status} duration={r.duration} href="#" onClick={(e) => { e.preventDefault(); onOpen(r); }} />
        ))}
      </div>
    </div>
  );
}

function MobileApp({ theme }) {
  const [mapMode, setMapMode] = React.useState('auto');
  const [sel, setSel] = React.useState(null);       // selected building key
  const [room, setRoom] = React.useState(null);

  if (room) {
    return (
      <window.AndroidDevice width={380} height={720} dark={theme === 'dark'}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--md-bg)' }}>
          <AppBar mode="back" title={room.name} onBack={() => setRoom(null)} actions={<SponsorAction />} />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}><RoomDetailBody room={room} /></div>
        </div>
      </window.AndroidDevice>
    );
  }
  return (
    <window.AndroidDevice width={380} height={720} dark={theme === 'dark'}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--md-bg)' }}>
        <AppBar mode="brand" actions={<SponsorAction />} />
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <MobileMain mode={mapMode} setMode={setMapMode} sel={sel} onSelect={setSel} onClear={() => setSel(null)} onOpen={setRoom} />
        </div>
      </div>
    </window.AndroidDevice>
  );
}

// ═══════════════════════ TABLET + DESKTOP (shared split) ═══════════════════
// Desktop is the tablet layout, scaled up and better: a navigation drawer
// (labelled) instead of the rail, browser chrome, a larger hero map and a
// roomier side panel. Same map → building → list → detail state machine.
function SplitApp({ theme, variant }) {
  const desktop = variant === 'desktop';
  const [tab, setTab] = React.useState('home');
  const [sel, setSel] = React.useState(null);
  const [building, setBuilding] = React.useState('All');
  const [room, setRoom] = React.useState(null);

  const pickBuilding = (k) => { setSel(k); setRoom(null); setBuilding(NAMES[k].label); setTab('rooms'); };
  const onNav = (id) => { setTab(id); setRoom(null); if (id !== 'map') { setSel(null); setBuilding('All'); } };
  const navActive = room ? 'rooms' : tab;

  let panel;
  if (room) {
    panel = (<><PanelHead title={room.name} sub={NAMES[LABEL2KEY[room.building]].name} onBack={() => setRoom(null)} action={desktop ? <SponsorAction /> : undefined} />
      <div style={scroller}><RoomDetailBody room={room} /></div></>);
  } else if (tab === 'rooms' || sel) {
    const label = building === 'All' ? 'All buildings' : NAMES[LABEL2KEY[building]].name;
    panel = (<><PanelHead title={building === 'All' ? 'Free Rooms' : `Building ${building}`} sub={label} onBack={sel ? () => { setSel(null); setBuilding('All'); setTab('home'); } : undefined} />
      <div style={scroller}><RoomListBody building={building} setBuilding={(b) => { setBuilding(b); setSel(b === 'All' ? null : LABEL2KEY[b]); }} onOpen={setRoom} activeIdent={room && room.ident} /></div></>);
  } else {
    panel = (<div style={scroller}><HomeBody compact onMap={() => setTab('rooms')} onFind={() => { setTab('rooms'); setBuilding('All'); }} onOpen={setRoom} /></div>);
  }

  const inner = (
    <>
      <AdaptiveNav variant={desktop ? 'drawer' : 'rail'} items={NAV_ITEMS} active={navActive} onSelect={onNav}
        footer={<div style={{ padding: desktop ? '4px 12px' : '0 6px 6px' }}><SponsorAction /></div>} />
      <div style={{ position: 'relative', flex: desktop ? 1.7 : 1.55, minWidth: 0, borderLeft: desktop ? '1px solid var(--md-outline-variant)' : 'none' }}>
        <MapBody mode={theme} sel={sel} onSelect={pickBuilding} overlaySelection={false} showTrees />
      </div>
      <aside style={{ width: desktop ? 420 : 336, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--md-surface)', borderLeft: '1px solid var(--md-outline-variant)' }}>
        {panel}
        <div style={{ borderTop: '1px solid var(--md-outline-variant)' }}><LiveFooter align="start" pad="8px 16px" /></div>
      </aside>
    </>
  );

  if (!desktop) {
    return (
      <div style={{ display: 'flex', width: 940, height: 600, background: 'var(--md-bg)', borderRadius: 22, overflow: 'hidden', border: '10px solid var(--md-outline-variant)', boxShadow: '0 30px 80px rgba(0,0,0,0.25)' }}>
        {inner}
      </div>
    );
  }
  return (
    <div style={{ width: 1180, height: 700, display: 'flex', flexDirection: 'column', background: 'var(--md-surface)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 90px rgba(0,0,0,0.28)', border: '1px solid var(--md-outline-variant)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--md-outline-variant)', background: 'var(--md-bg)', flexShrink: 0 }}>
        <span style={{ display: 'flex', gap: 6 }}>
          {['#ED6A5E', '#F4BF4F', '#61C554'].map(c => <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
        </span>
        <div style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--md-surface-1)', borderRadius: 999, padding: '5px 16px', fontSize: 12.5, color: 'var(--md-on-surface-variant)', fontFamily: 'var(--font-mono)' }}>
          {Icon.pin(14)} rooms.th-deg.de
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>{inner}</div>
    </div>
  );
}

// ═══════════════════════ SHELL ════════════════════════════════════════════
const LS = { get: (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
function RoomFinderApp() {
  const [device, setDevice] = React.useState(() => LS.get('rf_device', 'mobile'));
  const [theme, setTheme] = React.useState(() => LS.get('rf_theme', 'light'));
  const [color, setColor] = React.useState(() => LS.get('rf_color', 'thd'));
  React.useEffect(() => LS.set('rf_device', device), [device]);
  React.useEffect(() => LS.set('rf_theme', theme), [theme]);
  React.useEffect(() => LS.set('rf_color', color), [color]);

  const hue = (SWATCHES.find(s => s.id === color) || SWATCHES[0]).hue;
  const rootStyle = { ...dynamicVars(hue, theme === 'dark'), display: 'flex', flexDirection: 'column', height: '100%',
    background: 'var(--md-bg)', fontFamily: 'var(--font-sans)' };
  const stageEl = device === 'mobile'
    ? <MobileApp theme={theme} />
    : <SplitApp theme={theme} variant={device} />;
  return (
    <div data-theme={theme === 'dark' ? 'dark' : undefined} style={rootStyle}>
      <Toolbar device={device} setDevice={setDevice} theme={theme} setTheme={setTheme} color={color} setColor={setColor} />
      <div key={device} style={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', overflow: 'auto', padding: 26, background: 'var(--md-surface-1)' }}>
        {stageEl}
      </div>
    </div>
  );
}
window.RoomFinderApp = RoomFinderApp;
