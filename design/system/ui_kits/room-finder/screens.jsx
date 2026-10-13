// THD Room Finder — layout-agnostic content pieces for the responsive app.
// The flow is map-first: (light) Home hero → 2.5D Campus Map → tap a building →
// free-room list → room detail with the day's schedule. These bodies carry NO
// app-chrome (app bar / nav): the responsive shells in app.jsx compose them into
// the mobile device frame, the tablet split, and the desktop wide layout, so the
// exact same room data + map tint agree in every breakpoint.
const NS = window.THDRoomFinderDesignSystem_de229b;
const { RoomCard, StatusCard, CampusMap, Chip, Button, IconButton } = NS;

const CAMPUS = window.CAMPUS_GEOJSON;
const CONTEXT = window.CAMPUS_CONTEXT;
const RF = window.RF_ROOMS;

// ── derived data (scenario fixed to "now" for the app showcase) ──────────
const NAMES = {}; CAMPUS.features.forEach(f => { NAMES[f.properties.key] = f.properties; });
const AVAIL = RF.availFor('now', CAMPUS);
const TOTAL_FREE = Object.values(AVAIL).reduce((a, x) => a + x.free, 0);
const TOTAL_ROOMS = Object.values(AVAIL).reduce((a, x) => a + x.total, 0);
const BUILDING_COUNT = CAMPUS.features.length;
const LABEL2KEY = {}; CAMPUS.features.forEach(f => { LABEL2KEY[f.properties.label] = f.properties.key; });
const BUILDINGS = ['All', ...CAMPUS.features.map(f => f.properties.label)];

function roomsForLabel(label) {
  const key = LABEL2KEY[label];
  return RF.roomsFor(key, label, 'now', CAMPUS);
}
// All free rooms across campus, longest-free first (duration-ranked).
const FREE_ALL = (() => {
  const out = [], seen = new Set();
  CAMPUS.features.forEach(f => {
    roomsForLabel(f.properties.label).forEach(r => {
      if (r.isFree && !seen.has(r.ident)) { seen.add(r.ident); out.push(r); }
    });
  });
  return out.sort((a, b) => (b.rank - a.rank) || a.ident.localeCompare(b.ident));
})();

function availColor(a) {
  if (!a || a.free === 0) return '#74777F';
  return (a.total && a.free / a.total >= 0.5) ? 'var(--md-tertiary)' : '#4DB6AC';
}

// ── icons (single stroke set, sized by caller) ───────────────────────────
const ic = (paths, s = 22) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const Icon = {
  home: (s) => ic(<><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-6h5v6"/></>, s),
  map: (s) => ic(<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/></>, s),
  rooms: (s) => ic(<><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>, s),
  heart: (s) => ic(<path d="M20.8 4.6c-1.7-1.7-4.5-1.6-6.1.2L12 7.6 9.3 4.8C7.7 3 4.9 2.9 3.2 4.6c-1.8 1.8-1.8 4.7 0 6.5L12 20l8.8-8.9c1.8-1.8 1.8-4.7 0-6.5z"/>, s),
  back: (s) => ic(<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>, s),
  pin: (s) => ic(<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>, s),
};

const SponsorAction = () => (
  <IconButton label="Sponsor the iOS release" tone="sponsor" href="#">{Icon.heart(18)}</IconButton>
);

// ── live status caption (auto-refresh + offline are described, not simulated) ──
function LiveFooter({ align = 'center', pad = '0.5rem 0 0' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start',
      gap: 8, padding: pad, fontSize: 11.5, color: 'var(--md-on-surface-variant)', fontFamily: 'var(--font-sans)' }}>
      <span style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--md-tertiary)' }}></span>
        <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1.5px solid var(--md-tertiary)', opacity: 0.4 }}></span>
      </span>
      <span>Live · auto-refreshes every 30s · cached for offline</span>
    </div>
  );
}

// ── legend + building badge ──────────────────────────────────────────────
function Legend() {
  const items = [['#00897B', 'Open'], ['#4DB6AC', 'Some'], ['#C4C6D0', 'Full']];
  return (
    <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', gap: 12, alignItems: 'center',
      background: 'color-mix(in srgb, var(--md-surface) 90%, transparent)', border: '1px solid var(--md-outline-variant)',
      borderRadius: 999, padding: '6px 12px', fontSize: 11, color: 'var(--md-on-surface-variant)', boxShadow: 'var(--md-shadow-1)',
      backdropFilter: 'blur(6px)' }}>
      {items.map(([c, l]) => (
        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: c, display: 'inline-block' }}></span>{l}
        </span>
      ))}
    </div>
  );
}
function BuildingBadge({ label, color, size = 44 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 'var(--radius-m)', display: 'grid', placeItems: 'center',
      fontWeight: 700, fontSize: size >= 44 ? '0.95rem' : '0.8rem', color: '#fff', flexShrink: 0, background: color }}>{label}</div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MapBody — the 2.5D map + overlays. Fills its container in every layout.
//   overlaySelection: show the floating building card + "View Rooms" (mobile /
//   tablet). Desktop drives the panels itself, so it hides the overlay.
// ═══════════════════════════════════════════════════════════════════════════
function MapBody({ mode, sel, onSelect, onView, overlaySelection = true, hint = true, showTrees = true }) {
  const p = sel ? NAMES[sel] : null;
  const a = sel ? (AVAIL[sel] || { free: 0, total: 0 }) : null;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--md-bg)' }}>
      <CampusMap campus={CAMPUS} context={CONTEXT} availability={AVAIL}
        mode={mode} selectedKey={sel} onSelect={onSelect} showTrees={showTrees}
        style={{ width: '100%', height: '100%' }} />
      <Legend />
      {overlaySelection && p && (
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, background: 'var(--md-surface)',
          borderRadius: 'var(--radius-l)', boxShadow: 'var(--md-shadow-2)', padding: '0.9rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <BuildingBadge label={p.label} color={availColor(a)} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--md-on-surface)', textWrap: 'balance' }}>{p.name}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', marginTop: 2 }}>
              <b style={{ color: 'var(--md-on-surface)', fontVariantNumeric: 'tabular-nums' }}>{a.free}</b> of {a.total} rooms free
            </div>
          </div>
          {onView && <Button variant="filled" onClick={() => onView(p.label)}>View Rooms</Button>}
        </div>
      )}
      {overlaySelection && hint && !p && (
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, textAlign: 'center',
          background: 'color-mix(in srgb, var(--md-surface) 90%, transparent)', border: '1px solid var(--md-outline-variant)',
          borderRadius: 'var(--radius-l)', padding: '0.7rem 1rem', fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)',
          boxShadow: 'var(--md-shadow-1)', backdropFilter: 'blur(6px)' }}>
          Tap a building to see its free rooms
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HomeBody — the light Home hero. Map is the primary path.
// ═══════════════════════════════════════════════════════════════════════════
function HomeBody({ onMap, onFind, onOpen, compact = true }) {
  const preview = FREE_ALL.slice(0, compact ? 3 : 4);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem 1.25rem 1.5rem' }}>
      <div style={{ textAlign: 'center', paddingTop: '0.25rem' }}>
        <div style={{ fontSize: '5rem', fontWeight: 300, lineHeight: 1, color: 'var(--md-primary)', fontVariantNumeric: 'tabular-nums' }}>{TOTAL_FREE}</div>
        <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '0.6rem', color: 'var(--md-on-surface)' }}>rooms free right now</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--md-on-surface-variant)', marginTop: '0.3rem' }}>across {BUILDING_COUNT} buildings · {TOTAL_ROOMS} rooms total</div>
        <LiveFooter pad="0.75rem 0 0" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <Button variant="filled" onClick={onMap}>Open Campus Map</Button>
        <Button variant="tonal" onClick={onFind}>Find a Free Room</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--md-on-surface-variant)' }}>Longest free right now</span>
          <a href="#" onClick={(e) => { e.preventDefault(); onFind(); }} style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--md-primary)', textDecoration: 'none' }}>See all</a>
        </div>
        {preview.map(r => (
          <RoomCard key={r.ident} name={r.name} meta={`${r.building} · ${r.seats} seats`}
            status={r.status} duration={r.duration} href="#"
            onClick={(e) => { e.preventDefault(); onOpen(r); }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RoomListBody — building filter chips + count + the free-room list.
// ═══════════════════════════════════════════════════════════════════════════
function RoomListBody({ building, setBuilding, onOpen, activeIdent }) {
  const rooms = building === 'All' ? FREE_ALL : roomsForLabel(building).filter(r => r.isFree);
  const label = building === 'All' ? 'All buildings' : NAMES[LABEL2KEY[building]].name;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.75rem 0 0.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0 1rem 0.25rem', scrollbarWidth: 'none' }}>
          {BUILDINGS.map(b => (<Chip key={b} active={b === building} onClick={() => setBuilding(b)}>{b}</Chip>))}
        </div>
      </div>
      <div style={{ margin: '0.5rem 1rem 0', background: 'var(--md-surface-1)', borderRadius: 'var(--radius-l)', padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--md-on-surface)', fontVariantNumeric: 'tabular-nums' }}>{rooms.length} free rooms</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--md-on-surface-variant)', marginTop: '0.2rem', textWrap: 'balance' }}>{label} · right now</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem 1.25rem' }}>
        {rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--md-on-surface-variant)', fontSize: '0.875rem', background: 'var(--md-surface-1)', borderRadius: 'var(--radius-l)', textWrap: 'pretty' }}>
            No free rooms here right now. Try another building.
          </div>
        ) : rooms.map(r => (
          <RoomCard key={r.ident} name={r.name}
            meta={`${r.building} · ${r.floor === 0 ? 'Ground floor' : 'Floor ' + r.floor} · ${r.seats} seats`}
            status={r.status} duration={r.duration} href="#"
            style={r.ident === activeIdent ? { outline: '2px solid var(--md-primary)', outlineOffset: '-2px' } : undefined}
            onClick={(e) => { e.preventDefault(); onOpen(r); }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RoomDetailBody — status + facts + the day's schedule.
// ═══════════════════════════════════════════════════════════════════════════
function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--md-outline-variant)', fontSize: '0.875rem', alignItems: 'baseline' }}>
      <span style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0, minWidth: 84 }}>{label}</span>
      <span style={{ wordBreak: 'break-word' }}>{children}</span>
    </div>
  );
}
function RoomDetailBody({ room }) {
  const occupied = !room.isFree;
  const p = NAMES[LABEL2KEY[room.building]] || { name: room.building };
  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <StatusCard status={room.status}
        title={occupied ? 'Occupied now' : (room.status === 'soon' ? 'Closing soon' : 'Free now')}
        sub={occupied ? `Occupied until ${room.occUntil}` : (room.allDay ? 'No classes scheduled today' : `Free until ${room.freeUntil}`)}
        duration={occupied ? undefined : room.duration} />
      <section style={{ background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
        <InfoRow label="Building">{p.name} ({room.building})</InfoRow>
        <InfoRow label="Floor">{room.floor === 0 ? 'Ground floor' : `Floor ${room.floor}`}</InfoRow>
        <InfoRow label="Seats">{room.seats} regular</InfoRow>
        {room.facilities.length > 0 && <InfoRow label="Facilities">{room.facilities.join(', ')}</InfoRow>}
        <InfoRow label="Contact"><a href="#" style={{ color: 'var(--md-primary)' }}>{room.email}</a></InfoRow>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ fontWeight: 500, fontSize: '0.9375rem', padding: '0 0.25rem', margin: 0 }}>Schedule — Wed, Jun 25</h2>
        <div style={{ background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
          {room.schedule.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--md-on-surface-variant)' }}>No events scheduled — free all day</div>
          ) : room.schedule.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: i < room.schedule.length - 1 ? '1px solid var(--md-outline-variant)' : 'none', fontSize: '0.875rem', background: e.active ? 'var(--md-error-container)' : 'transparent' }}>
              <span style={{ color: 'var(--md-on-surface-variant)', fontVariantNumeric: 'tabular-nums', minWidth: 112, flexShrink: 0, fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>{e.time}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500 }}>{e.type}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', background: 'var(--md-surface-variant)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-s)' }}>{e.dur} min</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, {
  RF_DATA: { NAMES, AVAIL, LABEL2KEY, BUILDINGS, FREE_ALL, roomsForLabel, availColor,
    TOTAL_FREE, TOTAL_ROOMS, BUILDING_COUNT },
  RF_Icon: Icon, RF_SponsorAction: SponsorAction, RF_LiveFooter: LiveFooter,
  RF_BuildingBadge: BuildingBadge,
  MapBody, HomeBody, RoomListBody, RoomDetailBody,
});
