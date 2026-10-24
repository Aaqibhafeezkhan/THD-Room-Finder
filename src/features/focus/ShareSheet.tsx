import { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button, Sheet, ShareCard, Switch } from '../../components';
import { renderShareCard } from '../../components/focus/ShareCard';
import type { ShareCardOptions } from '../../components/focus/ShareCard';
import { useI18n } from '../../i18n';
import { useTheme } from '../../lib/theme';
import { useWindowClass } from '../../lib/useWindowClass';
import { formatHours, monthNames } from './copy';
import { PUBLIC_ORIGIN, shareLink } from './shareSnapshot';
import { useFocusStats } from './useFocusStats';

/**
 * Share the focus graph (D4, #38) as a link whose preview is the graph
 * (ADR 0003): in WhatsApp or Discord the friend sees the card, and opening it
 * lands on the app's campus map. The link carries the snapshot, so nothing is
 * stored on a server. It never shows rooms or times; name and batch are
 * opt-in and off each time the sheet opens. Save Image keeps the PNG for
 * stories and apps that drop link previews.
 */
export interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called with a snackbar message after a successful share or save. */
  onDone: (message: string) => void;
  /** Display name and batch, when signed in; each needs its own opt-in. */
  name?: string;
  batch?: string;
}

const FILE_EN = 'focus-graph.png';
const FILE_DE = 'fokus-verlauf.png';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function linkOrigin(): string {
  return Capacitor.isNativePlatform() ? PUBLIC_ORIGIN : window.location.origin;
}

export function ShareSheet({ open, onClose, onDone, name, batch }: ShareSheetProps) {
  const { t, locale } = useI18n();
  const { theme, accent } = useTheme();
  const cls = useWindowClass();
  // A shared image shows saved focus only, not a session still running.
  const stats = useFocusStats(undefined, { live: false });
  const [showName, setShowName] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [busy, setBusy] = useState(false);
  const canShare = useMemo(() => typeof navigator !== 'undefined' && typeof navigator.share === 'function', []);

  const dark =
    theme === 'dark' ||
    (theme === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches);

  const who = [showName ? name : undefined, showBatch ? batch : undefined].filter(Boolean).join(' · ') || undefined;
  const hours = formatHours(stats.semesterMinutes, locale);
  const options: ShareCardOptions = {
    format: 'square',
    days: stats.days,
    today: stats.today,
    semesterStart: stats.semester.start,
    semesterEnd: stats.semester.end,
    figures: [
      {
        num: hours.replace(/\D+$/, '').trim(),
        unit: hours.replace(/^[\d\s]+/, '').trim(),
        label: t('this semester', 'in diesem Semester'),
      },
      { num: String(stats.streak), unit: '', label: t('day streak', 'Tage in Folge') },
    ],
    who,
    months: monthNames(locale),
    theme: dark ? 'dark' : 'light',
    accent,
    iconSrc: '/icons/app-icon.svg',
    url: 'thd-room-finder.vercel.app',
  };
  const alt = t(
    `Focus graph image${who ? ` of ${who}` : ''}: ${hours} this semester, ${stats.streak}-day streak.`,
    `Bild des Fokus-Verlaufs${who ? ` von ${who}` : ''}: ${hours} in diesem Semester, ${stats.streak} Tage in Folge.`,
  );
  const filename = locale === 'de' ? FILE_DE : FILE_EN;

  const link = () =>
    shareLink(
      {
        days: stats.days,
        today: stats.today,
        semesterStart: stats.semester.start,
        semesterEnd: stats.semester.end,
        semesterMinutes: stats.semesterMinutes,
        streak: stats.streak,
        dark,
        accent: accent ?? 'violet',
        lang: locale === 'de' ? 'de' : 'en',
        name: showName ? name : undefined,
        batch: showBatch ? batch : undefined,
      },
      linkOrigin(),
    );

  const close = () => {
    setShowName(false);
    setShowBatch(false);
    onClose();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      close();
      onDone(t('Link copied', 'Link kopiert'));
    } catch {
      onDone(t("Couldn't copy the link", 'Link konnte nicht kopiert werden'));
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      await navigator.share({
        title: t('My focus this semester', 'Mein Fokus in diesem Semester'),
        text: t(`${hours} of focus this semester on THD Room Finder`, `${hours} Fokus in diesem Semester mit THD Room Finder`),
        url: link(),
      });
      close();
      onDone(t('Link shared', 'Link geteilt'));
    } catch (err) {
      // AbortError: the student closed the share sheet; stay here.
      if ((err as Error).name !== 'AbortError') onDone(t("Couldn't share the link", 'Link konnte nicht geteilt werden'));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      download(await renderShareCard(options), filename);
      close();
      onDone(t(`Image saved · ${filename}`, `Bild gespeichert · ${filename}`));
    } finally {
      setBusy(false);
    }
  };

  const title = t('Share focus graph', 'Fokus-Verlauf teilen');
  return (
    <Sheet open={open} onClose={close} label={title} variant={cls === 'compact' ? 'sheet' : 'dialog'} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        <h2 data-autofocus tabIndex={-1} style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 400, outline: 'none' }}>
          {title}
        </h2>
        <div style={{ width: '100%', maxWidth: 320, alignSelf: 'center' }}>
          {open && <ShareCard {...options} alt={alt} />}
        </div>
        {name && (
          <Switch checked={showName} onChange={setShowName} label={t('Show my name', 'Meinen Namen zeigen')} />
        )}
        {batch && (
          <Switch checked={showBatch} onChange={setShowBatch} label={t('Show my batch', 'Meinen Jahrgang zeigen')} />
        )}
        <p style={{ margin: 0, fontSize: 'var(--body-medium-size)', color: 'var(--md-on-surface-variant)' }}>
          {t(
            'Anyone with the link sees this graph as its preview, and opening it takes them to the app. It never shows rooms or times; the graph is in the link itself, not stored anywhere.',
            'Alle mit dem Link sehen diesen Verlauf als Vorschau, und der Link führt zur App. Er zeigt nie Räume oder Uhrzeiten; der Verlauf steckt im Link selbst und wird nirgends gespeichert.',
          )}
        </p>
        <Button variant="filled" disabled={busy} onClick={copy} style={{ width: '100%', minHeight: 48 }}>
          {t('Copy Link', 'Link kopieren')}
        </Button>
        {canShare && (
          <Button variant="outlined" disabled={busy} onClick={share} style={{ width: '100%', minHeight: 48 }}>
            {busy ? t('Opening Share…', 'Teilen wird geöffnet …') : t('Share Link', 'Link teilen')}
          </Button>
        )}
        <Button variant="text" disabled={busy} onClick={save} style={{ width: '100%', minHeight: 48 }}>
          {t('Save Image', 'Bild speichern')}
        </Button>
      </div>
    </Sheet>
  );
}
