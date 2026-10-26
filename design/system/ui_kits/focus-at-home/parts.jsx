// Focus at home (v2.6): the new and changed pieces, drafted on the design
// system's tokens and components. Unchanged pieces (Button, FocusButton,
// Sheet, FocusSummary, CheckInSheet, AdaptiveNav) come from the bundle.
const DS = window.THDRoomFinderDesignSystem_de229b || {};
const { Button, FocusButton, IconButton, Sheet } = DS;

// ── Icons: 24×24 Lucide shapes, stroke currentColor, like focusIcons ──────
const protoIcon = (paths) => function ProtoIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>{paths}</svg>
  );
};
const IconHome = protoIcon(<><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>);
const IconCampus = protoIcon(<><path d="M10 18v-7" /><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M3 22h18" /><path d="M6 18v-7" /></>);
const IconTimer = protoIcon(<><line x1="10" x2="14" y1="2" y2="2" /><line x1="12" x2="15" y1="14" y2="11" /><circle cx="12" cy="14" r="8" /></>);
const IconBreak = protoIcon(<><path d="M10 2v2" /><path d="M14 2v2" /><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" /><path d="M6 2v2" /></>);
const IconSound = protoIcon(<><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" /></>);
const IconMute = protoIcon(<><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><line x1="22" x2="16" y1="9" y2="15" /><line x1="16" x2="22" y1="9" y2="15" /></>);
const IconPlay = protoIcon(<polygon points="6 3 20 12 6 21 6 3" />);
const IconChevron = protoIcon(<path d="m9 18 6-6-6-6" />);
const IconMoon = protoIcon(<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" />);
const IconMap = protoIcon(<><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /><path d="M15 5.764v15" /><path d="M9 3.236v15" /></>);
const IconList = protoIcon(<><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M3 6h.01" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M8 6h13" /></>);
const IconPerson = protoIcon(<><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>);

// ── Sounds ─────────────────────────────────────────────────────────────────
const SOUND_SETS = [
  { id: 'coffee', name: 'Coffee break', line: 'Coffee pours for a break; three bright dings call you back' },
  { id: 'jingle', name: 'Jingle', line: 'Marimba falls for a break and climbs to start again' },
  { id: 'chimes', name: 'Chimes', line: 'Soft bells falling, then rising' },
  { id: 'phone', name: 'Phone default', line: "Your phone's notification sound" },
  { id: 'silent', name: 'Silent', line: 'Vibration only' },
];
const soundName = (id) => SOUND_SETS.find((s) => s.id === id)?.name ?? id;
const playable = (id) => id === 'coffee' || id === 'jingle' || id === 'chimes';

function playSound(set, event, volume = 1) {
  if (!playable(set)) return null;
  const a = new Audio(`${window.SOUND_BASE || "../../assets/sounds/"}${set}-${event}.mp3`);
  a.volume = volume;
  a.play().catch(() => {});
  return a;
}
function playPair(set) {
  if (!playable(set)) return;
  const a = playSound(set, 'break');
  if (a) a.addEventListener('ended', () => setTimeout(() => playSound(set, 'back'), 350), { once: true });
}

// ── Small parts ────────────────────────────────────────────────────────────
const muted = { color: 'var(--md-on-surface-variant)' };

/** The place of a session, top-left on the focus surface: house or room code. */
function PlaceChip({ place, label }) {
  return (
    <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px 0 8px',
      borderRadius: 'var(--radius-full)', background: 'var(--focus-state-layer)', fontSize: 13, fontWeight: 500 }}>
      {place === 'home' ? <IconHome size={16} /> : <IconCampus size={16} />}{label}
    </span>
  );
}

/** Round icon well, 40 px: violet for home (focus), teal for campus (free). */
function Well({ tone, children }) {
  const bg = tone === 'home' ? 'var(--md-focus-container)' : 'var(--md-tertiary-container)';
  const fg = tone === 'home' ? 'var(--md-on-focus-container)' : 'var(--md-on-tertiary-container)';
  return <span style={{ width: 40, height: 40, borderRadius: '50%', background: bg, color: fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{children}</span>;
}

function Card({ children, style }) {
  return <section style={{ background: 'var(--md-surface)', borderRadius: 'var(--radius-l)', boxShadow: 'var(--md-shadow-1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, ...style }}>{children}</section>;
}

/** "Pomodoro · 25 min focus, 5 min break   Change" */
function ChoiceLine({ icon, strong, rest, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
      <span style={{ ...muted, display: 'inline-flex' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--body-medium-size)', ...muted }}>
        <strong style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>{strong}</strong>{rest ? ` · ${rest}` : ''}
      </span>
      <Button variant="text" size="small" onClick={onChange}>Change</Button>
    </div>
  );
}

/** Focus tab, nothing running: the At home card. */
function StartCard({ rhythm, sound, other, onStart, onRhythm, onSound }) {
  return (
    <Card>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Well tone="home"><IconHome size={20} /></Well>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--title-medium-size)', fontWeight: 500 }}>At home</div>
          <div style={{ fontSize: 'var(--body-medium-size)', ...muted, textWrap: 'pretty' }}>Only you see it. It counts in your focus graph.</div>
        </div>
      </div>
      <FocusButton tone="start" fullWidth onClick={onStart}>Start focus at home</FocusButton>
      <div>
        <ChoiceLine icon={<IconTimer size={16} />} strong={rhythm.name} rest={rhythm.line} onChange={onRhythm} />
        <ChoiceLine icon={sound === 'silent' ? <IconMute size={16} /> : <IconSound size={16} />} strong={soundName(sound)} onChange={onSound} />
      </div>
      {other && <p style={{ margin: 0, fontSize: 'var(--body-small-size)', ...muted }}>This ends your session in {other}.</p>}
    </Card>
  );
}

/** Focus tab, nothing running: the On campus card that leads to Rooms. */
function CampusCard({ closed, onRooms }) {
  return (
    <Card>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Well tone="campus"><IconCampus size={20} /></Well>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--title-medium-size)', fontWeight: 500 }}>On campus</div>
          <div style={{ fontSize: 'var(--body-medium-size)', ...muted }}>
            {closed ? 'Classroom buildings closed · opens Tue 06:30' : <><span style={{ color: 'var(--md-tertiary)', fontWeight: 500 }}>38 rooms free</span> now</>}
          </div>
        </div>
        <Button variant="text" size="small" onClick={onRooms}>{closed ? 'Plan' : 'Find a room'}</Button>
      </div>
    </Card>
  );
}

function TodayLine({ minutes, streak, onGraph }) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  const time = h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', fontSize: 'var(--body-medium-size)', ...muted }}>
      <span style={{ flex: 1 }}>Today <strong style={{ color: 'var(--md-on-surface)', fontWeight: 500 }}>{time}</strong> · {streak}-day streak</span>
      <Button variant="text" size="small" onClick={onGraph}>View focus graph</Button>
    </div>
  );
}

/** The focus surface with a place (v2.6). Same card as room detail; at home a
 *  plain privacy line replaces Private/Public; a speaker button sits by End;
 *  breaks carry one tip. */
function PlaceSurface({ place, placeLabel, title, phase, phaseLabel, clock, track, plannedLine, tip, confirmLabel, onConfirm,
  note, roomAction, sound, onSound, onEnd, wide }) {
  const on = { color: 'var(--md-on-focus-container)' };
  return (
    <section aria-label={title} style={{ background: 'var(--md-focus-container)', color: 'var(--md-on-focus-container)', borderRadius: 'var(--radius-l)',
      boxShadow: 'var(--md-shadow-1)', padding: wide ? 24 : 16, display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4, marginRight: -8 }}>
        <PlaceChip place={place} label={placeLabel} />
        <button type="button" onClick={onSound} aria-pressed={!sound} aria-label="Sounds for this session" title={sound ? 'Sounds on for this session' : 'Sounds off for this session'}
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: sound ? 'transparent' : 'var(--focus-state-layer)', color: 'inherit', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          {sound ? <IconSound size={20} /> : <IconMute size={20} />}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
        {phase === 'focus' ? <IconTimer size={18} /> : <IconBreak size={18} />}
        <span style={{ flex: 1, minWidth: 0 }}>{title}</span>
        {phaseLabel && <span style={{ fontWeight: 400, fontSize: 13 }}>{phaseLabel}</span>}
      </div>
      {phase === 'confirm' && (
        <Button variant="filled" onClick={onConfirm} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)', alignSelf: 'stretch' }}>{confirmLabel}</Button>
      )}
      <div>
        <div role="timer" style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: phase === 'confirm' ? 32 : wide ? 72 : 48, fontWeight: 300, lineHeight: 1 }}>{clock}</div>
        {track && track.length > 1 && <div style={{ marginTop: 12 }}><Track segments={track} /></div>}
        <div style={{ fontSize: 13, marginTop: 8 }}>{plannedLine}</div>
      </div>
      {phase === 'break' && tip && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--radius-m)', background: 'var(--focus-state-layer)', fontSize: 13 }}>
          <IconBreak size={16} /><span>{tip}</span>
        </div>
      )}
      {note && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, textWrap: 'pretty' }}>{note}</p>}
      {roomAction}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.4, textWrap: 'pretty' }}>Keeps running when your phone is locked. After each break, tap to start the next block.</span>
        <Button variant="outlined" onClick={onEnd} style={{ ...on, borderColor: 'var(--md-on-focus-container)', flexShrink: 0 }}>End</Button>
      </div>
    </section>
  );
}

function Track({ segments }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', gap: 3, alignItems: 'center', height: 8 }}>
      {segments.map((seg, i) => {
        const fill = seg.state === 'done' ? 1 : seg.state === 'now' ? Math.min(1, Math.max(0, seg.progress ?? 0)) : 0;
        const tall = seg.kind === 'focus';
        return (
          <span key={i} style={{ flex: `${seg.minutes} 1 0`, minWidth: 4, height: tall ? 8 : 4, borderRadius: 'var(--radius-full)', overflow: 'hidden',
            background: 'var(--focus-state-layer)', outline: seg.state === 'now' ? '1px solid var(--md-on-focus-container)' : 'none', outlineOffset: 1 }}>
            <span style={{ display: 'block', width: `${fill * 100}%`, height: '100%', background: tall ? 'var(--md-on-focus-container)' : 'var(--md-focus)', opacity: tall ? 1 : 0.6 }} />
          </span>
        );
      })}
    </div>
  );
}

/** The app's closed notice (Campus and Rooms) with the new Focus at home button. */
function ClosedNotice({ onHome }) {
  return (
    <aside style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 'var(--radius-l)', background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}>
      <span style={{ paddingTop: 2 }}><IconMoon size={22} /></span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--title-medium-size)', fontWeight: 500 }}>Classroom buildings closed</h2>
        <p style={{ margin: 0, fontSize: 'var(--body-medium-size)' }}>Next scheduled opening: Tue, 27 Oct, 06:30</p>
        <p style={{ margin: 0, fontSize: 'var(--body-medium-size)' }}>▸ Opening hours and sources</p>
        <div style={{ marginTop: 8 }}>
          <Button variant="filled" size="small" icon={<IconHome size={18} />} onClick={onHome}>Focus at home</Button>
        </div>
      </div>
    </aside>
  );
}

function RadioRow({ checked, onSelect, children, trailing }) {
  return (
    <div role="radio" aria-checked={checked} tabIndex={0} onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56, padding: '6px 4px', cursor: 'pointer', fontSize: 'var(--body-large-size)', color: 'var(--md-on-surface)' }}>
      <span aria-hidden="true" style={{ width: 20, height: 20, flexShrink: 0, borderRadius: '50%', border: `2px solid ${checked ? 'var(--md-primary)' : 'var(--md-on-surface-variant)'}`, display: 'grid', placeItems: 'center' }}>
        {checked && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--md-primary)' }} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      {trailing}
    </div>
  );
}

/** Sounds at home / on campus: five options, each set with a preview. */
function SoundSheetBody({ title, value, place, onPick, onCancel }) {
  const [choice, setChoice] = React.useState(value);
  React.useEffect(() => setChoice(value), [value]);
  return (
    <>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{title}</h2>
      <div role="radiogroup" aria-label={title}>
        {SOUND_SETS.map((s) => (
          <RadioRow key={s.id} checked={choice === s.id} onSelect={() => setChoice(s.id)}
            trailing={playable(s.id) ? (
              <button type="button" aria-label={`Play ${s.name}`} onClick={(e) => { e.stopPropagation(); setChoice(s.id); playPair(s.id); }}
                style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <IconPlay size={16} />
              </button>
            ) : (place === 'home' && s.id === 'coffee') || (place === 'campus' && s.id === 'phone') ? <span style={{ ...muted, fontSize: 'var(--body-medium-size)' }}>default</span> : null}>
            <div>{s.name}</div>
            <div style={{ fontSize: 'var(--body-medium-size)', ...muted }}>{s.line}</div>
          </RadioRow>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 'var(--body-small-size)', ...muted, textWrap: 'pretty' }}>
        A sound when a break starts, another when it's over (once more 5 minutes later if you haven't started), and one when you're done. The speaker on the session turns them off for that session.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="text" onClick={onCancel}>Cancel</Button>
        <Button variant="filled" onClick={() => onPick(choice)}>Done</Button>
      </div>
    </>
  );
}

/** Settings → Focus, with the two new sound rows. */
function FocusSettings({ rhythm, home, campus, onHome, onCampus }) {
  const row = (label, sub, onClick, divider) => (
    <div onClick={onClick} style={{ minHeight: 56, display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderTop: divider ? '1px solid var(--md-outline-variant)' : 'none', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--body-large-size)' }}>{label}</div>
        <div style={{ fontSize: 'var(--body-medium-size)', ...muted }}>{sub}</div>
      </div>
      {onClick && <Button variant="text" size="small" onClick={onClick}>Change</Button>}
    </div>
  );
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ margin: 0, padding: '0 4px', fontSize: 'var(--title-small-size)', fontWeight: 500, color: 'var(--md-primary)' }}>Focus</h2>
      <div style={{ background: 'var(--md-surface)', borderRadius: 'var(--radius-l)', boxShadow: 'var(--md-shadow-1)', padding: '4px 16px' }}>
        {row('Rhythm', `${rhythm.name} · ${rhythm.line}`, () => {}, false)}
        {row('Sounds at home', soundName(home), onHome, true)}
        {row('Sounds on campus', soundName(campus), onCampus, true)}
        {row('Notifications', 'On · on the lock screen too', null, true)}
      </div>
    </section>
  );
}

/** What the lock screen shows (Android): place and phase only. */
function LockNotification({ title, text, clock, actions }) {
  return (
    <div style={{ width: 340, borderRadius: 20, background: '#2b2930', color: '#e6e1e9', padding: '12px 14px', fontFamily: 'var(--font-sans)', boxShadow: '0 6px 24px rgba(0,0,0,.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cac4d0' }}>
        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#6A4BA8', display: 'grid', placeItems: 'center', color: '#fff' }}><IconTimer size={12} /></span>
        THD Room Finder · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#cac4d0' }}>{text}</div>
      {actions && <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, fontWeight: 500, color: '#D0BCFF' }}>{actions.map((a) => <span key={a}>{a}</span>)}</div>}
    </div>
  );
}

Object.assign(window, {
  IconHome, IconCampus, IconTimer, IconBreak, IconSound, IconMute, IconPlay, IconChevron, IconMoon, IconMap, IconList, IconPerson,
  SOUND_SETS, soundName, playable, playSound, playPair, PlaceChip, Well, Card, ChoiceLine, StartCard, CampusCard, TodayLine,
  PlaceSurface, Track, ClosedNotice, RadioRow, SoundSheetBody, FocusSettings, LockNotification,
});
