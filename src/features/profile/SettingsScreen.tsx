import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, SegmentedControl, Switch } from '../../components';
import type { Accent, Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme';
import { useMapPrefs } from '../../lib/mapPrefs';
import { useI18n } from '../../i18n';
import { Page } from '../shared/ui';

/**
 * Settings behind the Profile gear (D2): a plain grouped list, one setting per
 * row, at least 56 px tall. Values wrap rather than truncate, so German fits.
 * Study profile and account groups join when sign-in and the local history
 * land.
 */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h2
        style={{
          margin: 0,
          padding: '0 var(--space-1)',
          fontSize: 'var(--title-small-size)',
          fontWeight: 500,
          color: 'var(--md-primary)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: 'var(--md-surface)',
          borderRadius: 'var(--radius-l)',
          boxShadow: 'var(--md-shadow-1)',
          padding: '4px 16px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </section>
  );
}

/** A labelled row with its control under or beside the label. */
export function SettingsRow({ label, sub, children, divider = false }: {
  label: string;
  sub?: ReactNode;
  children?: ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        minHeight: 56,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px 16px',
        padding: '10px 0',
        borderTop: divider ? '1px solid var(--md-outline-variant)' : 'none',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--body-large-size)', color: 'var(--md-on-surface)' }}>{label}</div>
        {sub && <div style={{ fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Swatch({ accent, dark }: { accent: Accent; dark: boolean }) {
  // The swatch shows the ramp's strongest step for that graph colour. Accent
  // ramps resolve per theme only where data-theme and data-accent meet.
  return (
    <span
      aria-hidden="true"
      data-theme={dark ? 'dark' : 'light'}
      data-accent={accent === 'violet' ? undefined : accent}
      style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--md-graph-4)', display: 'inline-block' }}
    />
  );
}

export function SettingsScreen({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { showGlyphs, setShowGlyphs } = useMapPrefs();
  const dark =
    theme === 'dark' ||
    (theme === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);

  const accents: { id: Accent; label: string }[] = [
    { id: 'violet', label: t('Violet', 'Violett') },
    { id: 'orchid', label: t('Orchid', 'Orchidee') },
    { id: 'graphite', label: t('Graphite', 'Graphit') },
  ];

  return (
    <>
      <AppBar
        mode="back"
        title={t('Settings', 'Einstellungen')}
        onBack={() => navigate('/profile')}
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      />
      <Page>
        {children}
        <SettingsGroup title={t('Appearance', 'Darstellung')}>
          <SettingsRow label={t('Theme', 'Design')}>
            <SegmentedControl<Theme>
              tone="primary"
              label={t('Theme', 'Design')}
              value={theme}
              onChange={setTheme}
              options={[
                { id: 'system', label: t('System', 'System') },
                { id: 'light', label: t('Light', 'Hell') },
                { id: 'dark', label: t('Dark', 'Dunkel') },
              ]}
            />
          </SettingsRow>
          <SettingsRow label={t('Language', 'Sprache')} divider>
            <SegmentedControl
              tone="primary"
              label={t('Language', 'Sprache')}
              value={locale}
              onChange={setLocale}
              options={[
                { id: 'en', label: 'English' },
                { id: 'de', label: 'Deutsch' },
              ]}
            />
          </SettingsRow>
          <SettingsRow label={t('Focus graph colour', 'Farbe des Fokus-Verlaufs')} divider>
            <SegmentedControl<Accent>
              tone="primary"
              label={t('Focus graph colour', 'Farbe des Fokus-Verlaufs')}
              value={accent}
              onChange={setAccent}
              options={accents.map((a) => ({ id: a.id, label: a.label, icon: <Swatch accent={a.id} dark={dark} /> }))}
            />
          </SettingsRow>
          <div style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
            <Switch
              checked={showGlyphs}
              onChange={setShowGlyphs}
              label={t('Map amenities', 'Karten-Symbole')}
              sub={t('Café and study spots on the campus map', 'Café und Lernplätze auf der Campus-Karte')}
            />
          </div>
        </SettingsGroup>
      </Page>
    </>
  );
}
