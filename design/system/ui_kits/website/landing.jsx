// THD Room Finder — marketing landing page, recreated from website/index.html.
const NS = window.THDRoomFinderDesignSystem_de229b;
const { Button, Card, Logo, IconButton } = NS;

const ICONS = {
  clock: 'M12 6v6l4 2 M12 2a10 10 0 100 20 10 10 0 000-20z',
};

function FeatherIcon({ paths, size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
const Heart = () => <FeatherIcon size={18} paths={["M20.8 4.6c-1.7-1.7-4.5-1.6-6.1.2L12 7.6 9.3 4.8C7.7 3 4.9 2.9 3.2 4.6c-1.8 1.8-1.8 4.7 0 6.5L12 20l8.8-8.9c1.8-1.8 1.8-4.7 0-6.5z"]} />;

const FEATURES = [
  { title: 'Real-time Availability', body: "See which rooms are free right now. Powered by THD's public THabella scheduling system — no scraping, always accurate.",
    paths: ['M12 6v6l4 2', 'M12 2a10 10 0 100 20 10 10 0 000-20z'] },
  { title: 'Building Filters', body: 'Filter instantly by building code — A, B, C, D, I, ITC and more. Find the closest free room to where you already are.',
    paths: ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10'] },
  { title: 'Schedule Lookup', body: 'Pick any future date and time to check availability ahead of schedule. Plan your study sessions in advance.',
    paths: ['M3 4h18v18H3z', 'M16 2v4', 'M8 2v4', 'M3 10h18'] },
  { title: 'Offline Support', body: 'Room data is cached locally with a 24-hour TTL. Browse the full list even without a connection — schedules update when back online.',
    paths: ['M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z', 'M8 2v16', 'M16 6v16'] },
];

function Nav() {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', height: 'var(--appbar-height)', background: 'var(--md-surface)', borderBottom: '1px solid var(--md-outline-variant)', position: 'sticky', top: 0, zIndex: 10 }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--md-on-surface)', fontSize: '1.375rem', fontWeight: 500 }}>
        <Logo size={24} /> THD Room Finder
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <IconButton label="Sponsor the iOS release" tone="sponsor" href="#"><Heart/></IconButton>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--md-on-surface-variant)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-xl)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
          GitHub
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  const stats = [['289', 'Classrooms'], ['5 min', 'Refresh rate'], ['0', 'Accounts needed']];
  return (
    <section style={{ display: 'flex', justifyContent: 'center', textAlign: 'center', padding: '5rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 'var(--content-narrow)', width: '100%' }}>
        <Logo size={80} style={{ margin: '0 auto 2rem', boxShadow: 'var(--md-shadow-2)' }} />
        <h1 style={{ fontSize: '2.75rem', fontWeight: 400, lineHeight: 1.15, marginBottom: '1rem', color: 'var(--md-on-surface)' }}>THD Room Finder</h1>
        <p style={{ fontSize: '1rem', color: 'var(--md-on-surface-variant)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 2.5rem' }}>
          Find free study rooms at Technische Hochschule Deggendorf — instantly. Real-time availability across 289 classrooms, no account required.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {stats.map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--md-primary)', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-on-surface-variant)', marginTop: '0.3rem', fontWeight: 500, textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="filled" icon={<FeatherIcon size={16} paths={['M2 12h20', 'M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z', 'M12 2a10 10 0 100 20 10 10 0 000-20z']} />} href="#">Use in Browser</Button>
          <Button variant="tonal" icon={<FeatherIcon size={16} paths={['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']} />} href="#">Download APK</Button>
          <Button variant="tonal" href="#">View Source</Button>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section style={{ padding: '4rem 1.5rem 5rem', maxWidth: 'var(--content-wide)', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.4rem', color: 'var(--md-on-surface)' }}>Everything a student needs</h2>
        <p style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.9375rem' }}>Simple, fast, and always up to date</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {FEATURES.map(f => (
          <Card key={f.title} style={{ padding: '1.5rem' }}>
            <div style={{ width: 40, height: 40, background: 'var(--md-primary-container)', borderRadius: 'var(--radius-m)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem', color: 'var(--md-on-primary-container)' }}>
              <FeatherIcon paths={f.paths} />
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--md-on-surface)' }}>{f.title}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', lineHeight: 1.65 }}>{f.body}</p>
          </Card>
        ))}
        <Card interactive href="#" style={{ padding: '1.5rem' }}>
          <div style={{ width: 40, height: 40, background: 'var(--sponsor-container)', borderRadius: 'var(--radius-m)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem', color: 'var(--sponsor)' }}>
            <Heart />
          </div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--sponsor)' }}>Help Launch iOS</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', lineHeight: 1.65 }}>One-time sponsorships go directly toward the Apple Developer Program so THD Room Finder can ship properly on iPhone.</p>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ textAlign: 'center', padding: '2rem 1.5rem', fontSize: '0.8125rem', color: 'var(--md-on-surface-variant)', borderTop: '1px solid var(--md-outline-variant)' }}>
      <p>THD Room Finder — For students at Technische Hochschule Deggendorf</p>
      <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', marginTop: '0.5rem' }}>
        <a href="#" style={{ color: 'var(--md-on-surface-variant)', textDecoration: 'none' }}>GitHub</a>
        <a href="#" style={{ color: 'var(--md-on-surface-variant)', textDecoration: 'none' }}>Releases</a>
        <a href="#" style={{ color: 'var(--md-on-surface-variant)', textDecoration: 'none' }}>THD Website</a>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div style={{ background: 'var(--md-bg)', minHeight: '100%' }}>
      <Nav /><Hero /><Features /><Footer />
    </div>
  );
}

Object.assign(window, { Landing });
