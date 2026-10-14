import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Button, ConfirmDialog, SegmentedControl, Snackbar, Switch } from '../../components';
import { exportHistory } from '../../domain/focusHistory';
import { useFocusHistory } from '../focus/FocusHistoryContext';
import type { Accent, Theme } from '../../lib/theme';
import { useTheme } from '../../lib/theme';
import { useMapPrefs } from '../../lib/mapPrefs';
import { useI18n } from '../../i18n';
import { Page } from '../shared/ui';

/**
 * Settings behind the Profile gear (D2): a plain grouped list, one setting per
 * row, at least 56 px tall. Values wrap rather than truncate, so German fits.
 * The focus history group exports, imports and clears the device-only history.
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

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Export, import and clear the device-only focus history (#38). */
function HistoryGroup({ onMessage }: { onMessage: (m: string) => void }) {
  const { t } = useI18n();
  const { entries, importFile, clear } = useFocusHistory();
  const [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const added = await importFile(await readText(file));
      onMessage(
        t(
          added === 1 ? '1 session imported' : `${added} sessions imported`,
          added === 1 ? '1 Session importiert' : `${added} Sessions importiert`,
        ),
      );
    } catch {
      onMessage(t("That file isn't a focus history export.", 'Diese Datei ist kein exportierter Fokus-Verlauf.'));
    }
    if (input.current) input.current.value = '';
  };

  return (
    <SettingsGroup title={t('Focus history', 'Fokus-Verlauf')}>
      <SettingsRow
        label={t('Stored on this device only', 'Nur auf diesem Gerät gespeichert')}
        sub={t(
          `${entries.length} sessions. Export them before you switch phones.`,
          `${entries.length} Sessions. Exportiere sie, bevor du das Handy wechselst.`,
        )}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0 12px' }}>
        <Button
          variant="tonal"
          disabled={entries.length === 0}
          onClick={() =>
            downloadText(exportHistory(entries, new Date()), `thd-focus-history-${new Date().toISOString().slice(0, 10)}.json`)
          }
        >
          {t('Export', 'Exportieren')}
        </Button>
        <Button variant="tonal" onClick={() => input.current?.click()}>
          {t('Import', 'Importieren')}
        </Button>
        <Button
          variant="text"
          disabled={entries.length === 0}
          onClick={() => setConfirm(true)}
          style={{ color: 'var(--md-error)' }}
        >
          {t('Clear history', 'Verlauf löschen')}
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          aria-label={t('Import focus history file', 'Datei mit Fokus-Verlauf importieren')}
          onChange={(e) => onFile(e.target.files?.[0])}
          style={{ display: 'none' }}
        />
      </div>
      <ConfirmDialog
        open={confirm}
        tone="danger"
        title={t('Clear focus history?', 'Fokus-Verlauf löschen?')}
        body={t(
          'Every session on this device is removed and your focus graph starts empty. Export first if you want to keep it.',
          'Alle Sessions auf diesem Gerät werden entfernt und dein Fokus-Verlauf beginnt leer. Exportiere ihn vorher, wenn du ihn behalten willst.',
        )}
        confirmLabel={t('Clear', 'Löschen')}
        cancelLabel={t('Cancel', 'Abbrechen')}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await clear();
          onMessage(t('Focus history cleared', 'Fokus-Verlauf gelöscht'));
        }}
      />
    </SettingsGroup>
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
  const [snack, setSnack] = useState('');
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
        <HistoryGroup onMessage={setSnack} />
      </Page>
      <Snackbar message={snack} onClose={() => setSnack('')} bottom={96} />
    </>
  );
}
