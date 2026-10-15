import { useMemo, useState } from 'react';
import { Button, Sheet, ShareCard, Switch } from '../../components';
import { renderShareCard } from '../../components/focus/ShareCard';
import type { ShareCardOptions } from '../../components/focus/ShareCard';
import { useI18n } from '../../i18n';
import { useTheme } from '../../lib/theme';
import { useWindowClass } from '../../lib/useWindowClass';
import { formatHours, monthNames } from './copy';
import { useFocusStats } from './useFocusStats';

/**
 * Share the focus graph as an image (D4, #38). The card is drawn on the device
 * from local history; it never shows rooms, times or the programme. Name and
 * batch are opt-in and off each time the sheet opens. Phones that can share
 * files get Share Image (Web Share API); everyone else saves a PNG.
 *
 * Sharing a link whose preview is the card (ADR 0003) waits for its
 * platform check; this sheet covers the image path from ADR 0002.
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

function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}

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

export function ShareSheet({ open, onClose, onDone, name, batch }: ShareSheetProps) {
  const { t, locale } = useI18n();
  const { theme, accent } = useTheme();
  const cls = useWindowClass();
  const stats = useFocusStats();
  const [showName, setShowName] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [busy, setBusy] = useState(false);
  const shareFiles = useMemo(canShareFiles, []);

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

  const close = () => {
    setShowName(false);
    setShowBatch(false);
    onClose();
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await renderShareCard(options);
      const file = new File([blob], filename, { type: 'image/png' });
      await navigator.share({ files: [file], title: t('Focus graph', 'Fokus-Verlauf'), text: alt });
      close();
      onDone(t('Image shared', 'Bild geteilt'));
    } catch (err) {
      // AbortError: the student closed the share sheet; stay here.
      if ((err as Error).name !== 'AbortError') onDone(t("Couldn't share the image", 'Bild konnte nicht geteilt werden'));
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
            'Anyone you send it to sees this card. It never shows rooms, times or your programme.',
            'Alle, denen du es schickst, sehen diese Karte. Sie zeigt nie Räume, Uhrzeiten oder deinen Studiengang.',
          )}
        </p>
        {shareFiles ? (
          <>
            <Button variant="filled" disabled={busy} onClick={share} style={{ width: '100%', minHeight: 48 }}>
              {busy ? t('Opening Share…', 'Teilen wird geöffnet …') : t('Share Image', 'Bild teilen')}
            </Button>
            <Button variant="text" disabled={busy} onClick={save} style={{ width: '100%', minHeight: 48 }}>
              {t('Save Image', 'Bild speichern')}
            </Button>
          </>
        ) : (
          <Button variant="filled" disabled={busy} onClick={save} style={{ width: '100%', minHeight: 48 }}>
            {t('Save Image', 'Bild speichern')}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
