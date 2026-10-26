// Focus at home (v2.6) prototype: a playable phone on a demo clock, then
// every state side by side in light and dark, the wide layout and the sounds.
const D = window.THDRoomFinderDesignSystem_de229b || {};
const { FocusSummary, CheckInSheet, Logo, Sheet, Button } = D;

// ── The rhythm engine, as in src/domain/focusRhythm.ts (minutes) ───────────
const RHYTHMS = {
  pomodoro: { name: 'Pomodoro', line: '25 min focus, 5 min break, 15 min after every 4th block', focus: 25, brk: 5, long: 15, every: 4 },
  deep: { name: 'Deep', line: '50 min focus, 10 min break', focus: 50, brk: 10, long: 0, every: 0 },
};
const CAP = 180;
const GRACE = 10;
const REMIND = 5;

function layoutPlan(r, until = CAP) {
  const out = [];
  let t = 0;
  for (let b = 1; t < until; b++) {
    out.push({ kind: 'focus', block: b, start: t, end: Math.min(t + r.focus, until) });
    t += r.focus;
    const pause = r.every && b % r.every === 0 ? r.long : r.brk;
    if (t < until) out.push({ kind: 'break', block: b, start: t, end: Math.min(t + pause, until) });
    t += pause;
  }
  while (out.length && out[out.length - 1].kind === 'break') out.pop();
  const last = out[out.length - 1];
  if (out.length > 1 && last.end - last.start < 10) { out.pop(); while (out[out.length - 1].kind === 'break') out.pop(); }
  return { phases: out, end: out[out.length - 1].end, blocks: out.filter((p) => p.kind === 'focus').length };
}

function statusAt(plan, confirmed, t) {
  const pending = plan.phases.find((p) => p.kind === 'focus' && p.block > confirmed);
  if (pending && t >= pending.start) {
    const deadline = Math.min(pending.start + GRACE, pending.end);
    if (t < deadline) return { kind: 'confirm', phase: pending, deadline };
    return { kind: 'done', reason: 'unconfirmed' };
  }
  if (t >= plan.end) return { kind: 'done', reason: 'planned' };
  const i = Math.max(0, plan.phases.findIndex((p) => t >= p.start && t < p.end));
  return { kind: plan.phases[i].kind, phase: plan.phases[i], next: plan.phases[i + 1] };
}

const hhmm = (base, min) => {
  const m = Math.round(base + min);
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;
};
const mmss = (min) => {
  const s = Math.max(0, Math.round(min * 60));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const TIPS = ['Stand up and stretch.', 'Refill your water.', 'Rest your eyes: look out of a window.', 'Make a coffee or a tea.', 'Walk around for a minute.'];

/** Everything the screens need from a running session, at time t. */
function viewOf(s, t, base) {
  const st = statusAt(s.plan, s.confirmed, t);
  if (st.kind === 'done') return { done: true, st };
  const p = st.phase;
  const blockLabel = `Block ${p.block} of ${s.plan.blocks}`;
  const track = s.plan.phases.map((x) => ({
    kind: x.kind, minutes: x.end - x.start,
    state: t >= x.end ? 'done' : t >= x.start ? 'now' : 'next', progress: (t - x.start) / (x.end - x.start),
  }));
  const endLine = s.place === 'home' ? `ends ${hhmm(base, s.plan.end)} at the latest` : `ends ${hhmm(base, s.plan.end)}, before the 12:45 lecture`;
  if (st.kind === 'confirm') {
    return { st, phase: 'confirm', title: "Break's over", phaseLabel: blockLabel, clock: mmss(st.deadline - t), track,
      plannedLine: `No answer by ${hhmm(base, st.deadline)} ends the session.`,
      confirmLabel: `Start Block ${p.block}` };
  }
  if (st.kind === 'break') {
    return { st, phase: 'break', title: 'Break', phaseLabel: `Block ${p.block + 1} of ${s.plan.blocks} next`, clock: mmss(p.end - t), track,
      plannedLine: `Block ${p.block + 1} at ${hhmm(base, p.end)} · ${endLine}`, tip: TIPS[(p.block - 1) % TIPS.length] };
  }
  return { st, phase: 'focus', title: 'Focus', phaseLabel: blockLabel, clock: mmss(p.end - t), track,
    plannedLine: st.next ? `Break at ${hhmm(base, p.end)} · ${endLine}` : `Last block · ${endLine}` };
}

// ── Chrome: brand header with the session pill, bottom bar ───────────────
function FocusPillProto({ view, place, room }) {
  const focusing = view.phase === 'focus';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px 0 10px', borderRadius: 'var(--radius-full)',
      background: focusing ? 'var(--md-focus)' : 'var(--md-focus-container)', color: focusing ? 'var(--md-on-focus)' : 'var(--md-on-focus-container)',
      font: '500 13px var(--font-sans)', whiteSpace: 'nowrap', boxShadow: 'var(--md-shadow-1)' }}>
      {focusing ? <IconTimer size={16} /> : <IconBreak size={16} />}
      <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{view.clock}</span>
      {place === 'home' ? <IconHome size={16} /> : <span>{room}</span>}
    </span>
  );
}

function Header({ title, pill }) {
  return (
    <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 0 16px', borderBottom: '1px solid var(--md-outline-variant)', background: 'var(--md-surface)' }}>
      {Logo ? <Logo size={28} /> : <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--md-primary)' }} />}
      <span style={{ flex: 1, fontSize: 'var(--title-large-size)', fontWeight: 500 }}>{title}</span>
      {pill}
    </div>
  );
}

const TABS = [
  { id: 'campus', label: 'Campus', icon: <IconMap size={24} /> },
  { id: 'rooms', label: 'Rooms', icon: <IconList size={24} /> },
  { id: 'focus', label: 'Focus', icon: <IconTimer size={24} /> },
  { id: 'profile', label: 'Profile', icon: <IconPerson size={24} /> },
];

function NavBar({ active, onSelect }) {
  return (
    <nav style={{ display: 'flex', height: 80, flexShrink: 0, background: 'var(--md-surface)', borderTop: '1px solid var(--md-outline-variant)' }}>
      {TABS.map((it) => {
        const on = it.id === active;
        return (
          <button key={it.id} type="button" onClick={() => onSelect && onSelect(it.id)} aria-current={on ? 'page' : undefined}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-sans)', minWidth: 0 }}>
            <span style={{ width: 56, height: 32, borderRadius: 'var(--radius-xl)', display: 'grid', placeItems: 'center', background: on ? 'var(--md-secondary-container)' : 'transparent', color: on ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)' }}>{it.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: on ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)' }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Rail({ active }) {
  return (
    <nav style={{ width: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingBlock: 12, background: 'var(--md-surface)', borderRight: '1px solid var(--md-outline-variant)' }}>
      {Logo ? <Logo size={32} /> : null}
      <div style={{ height: 16 }} />
      {TABS.map((it) => {
        const on = it.id === active;
        return (
          <div key={it.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0', fontSize: 12, fontWeight: 500, color: on ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)' }}>
            <span style={{ width: 56, height: 32, borderRadius: 'var(--radius-xl)', display: 'grid', placeItems: 'center', background: on ? 'var(--md-secondary-container)' : 'transparent' }}>{it.icon}</span>
            {it.label}
          </div>
        );
      })}
    </nav>
  );
}

// ── The Focus tab, every state from one description ───────────────────────
function FocusTab({ m, act, wide }) {
  const r = RHYTHMS[m.rhythm];
  if (m.session && m.view && !m.view.done) {
    const s = m.session, v = m.view;
    const home = s.place === 'home';
    return (
      <PlaceSurface wide={wide} place={s.place} placeLabel={home ? 'At home' : s.room} title={v.title} phase={v.phase} phaseLabel={v.phaseLabel}
        clock={v.clock} track={v.track} plannedLine={v.plannedLine} tip={v.tip} confirmLabel={v.confirmLabel} onConfirm={act.confirm}
        note={home ? 'Only you see this session.' : 'Private · others see that someone is focusing here, not who.'}
        roomAction={home ? null : <div style={{ marginLeft: -12 }}><Button variant="text" size="small" onClick={act.openRoom} style={{ color: 'var(--md-on-focus-container)' }}>Open {s.room}</Button></div>}
        sound={!s.muted} onSound={act.toggleSound} onEnd={act.end} />
    );
  }
  return (
    <>
      {m.ended && (
        <FocusSummary title="Session ended" added={m.ended.added} addedLabel={m.ended.blocks > 1 ? `of focus in ${m.ended.blocks} blocks, added to your focus graph` : 'of focus, added to your focus graph'}
          todayLine={`Today ${m.ended.today} · 4-day streak`} viewGraphLabel="View Focus Graph" onViewGraph={act.profile} />
      )}
      <StartCard rhythm={r} sound={m.sounds.home} other={m.other} onStart={act.startHome} onRhythm={act.rhythm} onSound={act.soundSheet} />
      <CampusCard closed={m.closed} onRooms={act.rooms} />
      {!m.ended && <TodayLine minutes={m.todayMinutes} streak={3} onGraph={act.profile} />}
    </>
  );
}

function RoomsTab({ m, act }) {
  if (m.closed) {
    return (
      <>
        <ClosedNotice onHome={act.focusTab} />
        <div style={{ alignSelf: 'center', padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)', fontSize: 'var(--body-large-size)' }}>Plan for Tue, 27 Oct, 06:30</div>
      </>
    );
  }
  return (
    <>
      <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>Rooms is unchanged. Tap a room to start focus there.</div>
      {['C211', 'E212', 'ITC2 0.15'].map((code, i) => (
        <div key={code} onClick={() => act.startRoom(code)} style={{ cursor: 'pointer', background: 'var(--md-surface)', borderRadius: 'var(--radius-l)', boxShadow: 'var(--md-shadow-1)', padding: 16, display: 'flex', alignItems: 'center' }}>
          <span style={{ flex: 1 }}><strong style={{ fontWeight: 500, fontSize: 'var(--title-medium-size)' }}>{code}</strong><br /><span style={{ color: 'var(--md-tertiary)' }}>Free now</span></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--md-tertiary)' }}>{['2h 40m', '1h 55m', '1h 10m'][i]}</span>
        </div>
      ))}
    </>
  );
}

function CampusTab({ m, act }) {
  return (
    <>
      <div style={{ height: 230, borderRadius: 'var(--radius-l)', background: 'repeating-linear-gradient(45deg, var(--md-surface-variant), var(--md-surface-variant) 8px, var(--md-surface) 8px, var(--md-surface) 16px)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--md-on-surface-variant)' }}>campus map (unchanged)</div>
      {m.closed && <ClosedNotice onHome={act.focusTab} />}
    </>
  );
}

function ProfileTab() {
  return (
    <section style={{ background: 'var(--md-surface)', borderRadius: 'var(--radius-l)', boxShadow: 'var(--md-shadow-1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 'var(--title-medium-size)', fontWeight: 500 }}>Focus graph</div>
      <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>Unchanged, except: a weekend or holiday with focus now adds to the streak, and the day detail says how much was at home.</div>
      <div style={{ fontSize: 'var(--body-medium-size)' }}>Sat 24 Oct · 1 h 15 min · <span style={{ color: 'var(--md-focus)' }}>1 h 15 min at home</span></div>
    </section>
  );
}

/** One phone: header, the tab's page, bottom bar, sheets over it. */
function Phone({ m, act, theme, label }) {
  const pillView = m.session && m.view && !m.view.done && m.tab !== 'focus' ? m.view : null;
  const titles = { campus: 'Campus', rooms: 'THD Room Finder', focus: 'Focus', profile: 'Profile', settings: 'Settings' };
  const page = m.tab === 'focus' ? <FocusTab m={m} act={act} /> : m.tab === 'rooms' ? <RoomsTab m={m} act={act} /> : m.tab === 'campus' ? <CampusTab m={m} act={act} />
    : m.tab === 'settings' ? <FocusSettings rhythm={RHYTHMS[m.rhythm]} home={m.sounds.home} campus={m.sounds.campus} onHome={() => act.soundSheet('home')} onCampus={() => act.soundSheet('campus')} /> : <ProfileTab />;
  const checkIn = m.view && !m.view.done && m.view.phase === 'confirm' && m.tab !== 'focus';
  return (
    <div className="shot" data-screen-label={label}>
      {label && <div className="label">{label}</div>}
      <div data-theme={theme} className="phone">
        <Header title={titles[m.tab]} pill={pillView && <span onClick={act.focusTab} style={{ cursor: 'pointer' }}><FocusPillProto view={pillView} place={m.session.place} room={m.session.room} /></span>} />
        <div className="page">{page}</div>
        <NavBar active={m.tab === 'settings' ? 'profile' : m.tab} onSelect={act.tab} />
        {m.sheet && Sheet && (
          <Sheet open contained variant="sheet" label={m.sheet === 'home' ? 'Sounds at home' : 'Sounds on campus'} onClose={act.closeSheet}>
            <SoundSheetBody title={m.sheet === 'home' ? 'Sounds at home' : 'Sounds on campus'} place={m.sheet} value={m.sounds[m.sheet]} onCancel={act.closeSheet} onPick={(v) => act.setSound(m.sheet, v)} />
          </Sheet>
        )}
        {CheckInSheet && (
          <CheckInSheet open={Boolean(checkIn)} contained variant="sheet" title={m.session?.place === 'home' ? "Break's over at home" : `Break's over in ${m.session?.room}`}
            meta={checkIn ? `${m.view.phaseLabel} · ${m.session.place === 'home' ? 'At home' : m.session.room}` : ''} body={checkIn ? m.view.plannedLine : ''}
            endLabel="End" keepLabel={checkIn ? m.view.confirmLabel : ''} onKeep={act.confirm} onEnd={act.end} />
        )}
      </div>
    </div>
  );
}

// ── The playable phone ─────────────────────────────────────────────────────
const noop = () => {};
const NO_ACT = new Proxy({}, { get: () => noop });

function Playable({ theme }) {
  const [scenario, setScenario] = React.useState('evening');
  const base = scenario === 'evening' ? 20 * 60 + 15 : 10 * 60 + 5;
  const [speed, setSpeed] = React.useState(1); // demo minutes per second
  const [clock, setClock] = React.useState(0);
  const [tab, setTab] = React.useState('focus');
  const [session, setSession] = React.useState(null);
  const [ended, setEnded] = React.useState(null);
  const [rhythm] = React.useState('pomodoro');
  const [sounds, setSounds] = React.useState({ home: 'coffee', campus: 'phone' });
  const [sheet, setSheet] = React.useState(null);
  const [log, setLog] = React.useState([]);
  const fired = React.useRef(new Set());
  const clockRef = React.useRef(0);

  React.useEffect(() => {
    let last = performance.now(), id;
    const loop = (now) => {
      clockRef.current += ((now - last) / 1000) * speed;
      last = now;
      setClock(clockRef.current);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [speed]);

  const t = session ? clock - session.at : 0;
  const view = session ? viewOf(session, t, base + session.at) : null;
  const set = session && !session.muted ? sounds[session.place === 'home' ? 'home' : 'campus'] : 'silent';

  // Sounds at the phase boundaries: break, break's over (+ one reminder), done.
  React.useEffect(() => {
    if (!session || !view) return;
    const st = view.st;
    const key = (k) => `${session.id}:${k}`;
    const fire = (k, event, vol, text) => {
      if (fired.current.has(key(k))) return;
      fired.current.add(key(k));
      playSound(set, event, vol);
      setLog((l) => [`${hhmm(base, clock)}  ${text}${playable(set) ? ` · ${soundName(set)}` : set === 'phone' ? ' · phone sound' : ' · silent'}`, ...l].slice(0, 6));
    };
    if (st.kind === 'break') fire(`b${st.phase.block}`, 'break', 1, `Break ${st.phase.block} starts`);
    if (st.kind === 'confirm') {
      fire(`c${st.phase.block}`, 'back', 1, `Break's over: start block ${st.phase.block}`);
      if (t >= st.phase.start + REMIND) fire(`r${st.phase.block}`, 'back', 0.45, 'Reminder, quieter');
    }
    if (st.kind === 'done') {
      if (st.reason === 'planned') fire('done', 'done', 1, 'Session done');
      const mins = session.plan.phases.filter((p) => p.kind === 'focus' && p.block <= session.confirmed).reduce((a, p) => a + (p.end - p.start), 0);
      finish(mins, session.confirmed);
    }
  });

  const finish = (mins, blocks) => {
    const fmt = (x) => (x >= 60 ? `${Math.floor(x / 60)} h ${x % 60 ? `${x % 60} min` : ''}`.trim() : `${x} min`);
    setEnded({ added: fmt(mins), blocks, today: fmt(mins + 50) });
    setSession(null);
  };
  const start = (place, room) => {
    setEnded(null);
    setSession({ id: Math.random(), place, room, at: clockRef.current, plan: layoutPlan(RHYTHMS[rhythm], place === 'home' ? CAP : 155), confirmed: 1, muted: false });
    setTab('focus');
    setLog([]);
  };
  const act = {
    startHome: () => start('home'),
    startRoom: (code) => start('room', code),
    confirm: () => session && view.st.kind === 'confirm' && setSession({ ...session, confirmed: view.st.phase.block }),
    end: () => {
      if (!session) return;
      const mins = Math.floor(session.plan.phases.filter((p) => p.kind === 'focus' && p.block <= session.confirmed).reduce((a, p) => a + Math.max(0, Math.min(p.end, t) - p.start), 0));
      finish(mins, session.confirmed);
    },
    toggleSound: () => session && setSession({ ...session, muted: !session.muted }),
    tab: (id) => setTab(id),
    focusTab: () => setTab('focus'),
    rooms: () => setTab('rooms'),
    profile: () => setTab('profile'),
    openRoom: () => setTab('rooms'),
    rhythm: noop,
    soundSheet: (place) => setSheet(typeof place === 'string' ? place : 'home'),
    closeSheet: () => setSheet(null),
    setSound: (place, v) => { setSounds({ ...sounds, [place]: v }); setSheet(null); },
  };
  const skip = () => {
    if (!session || !view || view.done) return;
    const st = view.st;
    const target = st.kind === 'confirm' ? Math.min(st.phase.start + REMIND, st.deadline) - 0.05 : st.phase.end - 0.08;
    clockRef.current = session.at + target - 0.02;
  };
  const m = { tab, session, view, ended, rhythm, sounds, sheet, closed: scenario === 'evening', other: null, todayMinutes: 50 };
  const notif = session && view && !view.done
    ? view.phase === 'confirm'
      ? { title: `Break's over · ${session.place === 'home' ? 'At home' : session.room}`, text: view.plannedLine, actions: [view.confirmLabel, 'End'] }
      : { title: `${view.title} · ${session.place === 'home' ? 'At home' : session.room}`, text: view.plannedLine, actions: ['End'] }
    : null;

  return (
    <div className="play">
      <Phone m={m} act={act} theme={theme} />
      <div className="controls">
        <h3>Play it</h3>
        <p>The clock runs fast so a whole Pomodoro fits in a minute. Turn your volume up: the sounds are the real files.</p>
        <div className="seg">
          <button className={scenario === 'evening' ? 'on' : ''} onClick={() => { setScenario('evening'); setSession(null); setEnded(null); setTab('focus'); }}>Evening at home · campus closed</button>
          <button className={scenario === 'morning' ? 'on' : ''} onClick={() => { setScenario('morning'); setSession(null); setEnded(null); setTab('rooms'); }}>Morning on campus · rooms free</button>
        </div>
        <div className="seg">
          {[[1, '1 s = 1 min'], [4, '1 s = 4 min']].map(([v, l]) => <button key={v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{l}</button>)}
          <button onClick={skip} disabled={!session}>Skip to the next sound</button>
        </div>
        <div className="clock">Demo time {hhmm(base, clock - (session ? 0 : 0))}</div>
        <h4>Lock screen (Android)</h4>
        {notif ? <LockNotification title={notif.title} text={notif.text} clock={view.clock} actions={notif.actions} /> : <p className="muted">Start a session to see it.</p>}
        <h4>What played</h4>
        {log.length ? <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul> : <p className="muted">Nothing yet. The first sound comes when block 1 ends.</p>}
      </div>
    </div>
  );
}

// ── Fixed states for the storyboard ────────────────────────────────────────
function fixed(place, t, extra = {}) {
  const plan = layoutPlan(RHYTHMS.pomodoro, place === 'home' ? CAP : 155);
  const session = { id: 1, place, room: place === 'home' ? null : 'C211', at: 0, plan, confirmed: extra.confirmed ?? 1, muted: extra.muted ?? false };
  return { session, view: viewOf(session, t, place === 'home' ? 20 * 60 + 15 : 10 * 60 + 5) };
}
const BASE_M = { rhythm: 'pomodoro', sounds: { home: 'coffee', campus: 'phone' }, sheet: null, other: null, todayMinutes: 50, ended: null, session: null, view: null };
const STATES = [
  { label: '1 · Focus tab, evening: campus closed', m: { ...BASE_M, tab: 'focus', closed: true } },
  { label: '2 · Running at home, block 1', m: { ...BASE_M, tab: 'focus', closed: true, ...fixed('home', 7.6) } },
  { label: '3 · Break, with a tip (break sound plays)', m: { ...BASE_M, tab: 'focus', closed: true, ...fixed('home', 27.2) } },
  { label: "4 · Break's over (inviting sound, reminder after 5 min)", m: { ...BASE_M, tab: 'focus', closed: true, ...fixed('home', 31.5) } },
  { label: '5 · Ended: summary, start again (done sound at the planned end)', m: { ...BASE_M, tab: 'focus', closed: true, ended: { added: '1 h 40 min', blocks: 4, today: '2 h 30 min' } } },
  { label: '6 · Rooms at night: Focus at home', m: { ...BASE_M, tab: 'rooms', closed: true } },
  { label: '7 · Another tab: the pill shows the home session', m: { ...BASE_M, tab: 'campus', closed: true, ...fixed('home', 12) } },
  { label: '8 · Focus tab, morning: a session runs in C211', m: { ...BASE_M, tab: 'focus', closed: false, ...fixed('room', 41, { confirmed: 2 }) } },
  { label: '9 · Focus tab, morning: nothing running', m: { ...BASE_M, tab: 'focus', closed: false } },
  { label: '10 · Settings → Focus: sounds per place', m: { ...BASE_M, tab: 'settings', closed: true } },
  { label: '11 · Sounds at home (play to preview)', m: { ...BASE_M, tab: 'settings', closed: true, sheet: 'home' } },
  { label: '12 · Sound off for this session', m: { ...BASE_M, tab: 'focus', closed: true, ...fixed('home', 15, { muted: true }) } },
];

function Board({ theme }) {
  return <div className="row">{STATES.map((s) => <Phone key={s.label} m={s.m} act={NO_ACT} theme={theme} label={s.label} />)}</div>;
}

function Wide({ theme }) {
  const { session, view } = fixed('home', 9.4);
  return (
    <div className="shot" data-screen-label="Desktop, running at home">
      <div className="label">Tablet and desktop: Focus in the rail, the surface centred (max 560 px), a larger timer</div>
      <div data-theme={theme} className="desk">
        <Rail active="focus" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header title="Focus" />
          <div style={{ flex: 1, display: 'grid', placeItems: 'start center', padding: 32, overflow: 'hidden' }}>
            <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FocusTab m={{ ...BASE_M, tab: 'focus', closed: true, session, view }} act={NO_ACT} wide />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoundTable() {
  const rows = SOUND_SETS.filter((s) => playable(s.id));
  const cell = (set, ev, label) => (
    <button className="snd" onClick={() => playSound(set, ev)}><IconPlay size={14} /> {label}</button>
  );
  return (
    <table className="sounds">
      <thead><tr><th>Set</th><th>Break starts <small>falls</small></th><th>Break's over <small>rises</small></th><th>Session done <small>resolves</small></th></tr></thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id}><td><b>{s.name}</b><br /><small>{s.line}</small></td>
            <td>{cell(s.id, 'break', s.id === 'coffee' ? 'Pour and clink' : s.id === 'jingle' ? 'Sol · mi · do' : 'Bells down')}</td>
            <td>{cell(s.id, 'back', s.id === 'coffee' ? 'Three dings up' : s.id === 'jingle' ? 'Do · mi · sol · do' : 'Bells up')}</td>
            <td>{cell(s.id, 'done', s.id === 'coffee' ? 'Warm chord' : s.id === 'jingle' ? 'Flourish' : 'Singing bowl')}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function Page() {
  const [theme, setTheme] = React.useState('light');
  return (
    <main data-theme={theme} className="doc">
      <header className="top">
        <div>
          <h1>Focus at home</h1>
          <p className="lede">v2.6 prototype. The same focus session without a room: a Focus tab to start it and find any running session, a place on every session (At home or a campus room), and sounds that tell a break from back-to-focus. Spec: docs/product/focus-at-home.md.</p>
        </div>
        <div className="seg">
          <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>Light</button>
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>Dark</button>
        </div>
      </header>
      <Playable theme={theme} />
      <h2>Every state</h2>
      <Board theme={theme} />
      <h2>Wide</h2>
      <Wide theme={theme} />
      <h2>Sounds</h2>
      <p className="lede">Down for a break, up for focus, resolve when done. Each under 2.5 s, soft attack, peaks at −6 dBFS. Made by scripts/dev/focus_sounds.py. Home defaults to Coffee break; campus keeps the phone's own sound unless you change it.</p>
      <SoundTable />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
