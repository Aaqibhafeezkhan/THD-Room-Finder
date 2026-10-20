import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Sheet } from '../../components';
import { ServiceError } from '../../data/identityApi';
import { isSlug, registryIssueUrl, slugFrom } from '../../domain/gatherings';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';
import { useGatherings } from './GatheringsContext';
import { gatheringErrorText } from './copy';

/**
 * Register your group (O1, O2): the group's public details, stored as a
 * request; then the registry's issue form opens with the request number,
 * where the applicant gives their role and one proof that they speak for
 * the group. Nothing personal goes into the issue.
 */
export interface RegisterSheetProps {
  open: boolean;
  onClose: () => void;
}

const field: CSSProperties = {
  width: '100%',
  minHeight: 48,
  boxSizing: 'border-box',
  padding: '0 14px',
  borderRadius: 'var(--radius-s)',
  border: '1px solid var(--md-outline)',
  background: 'var(--md-surface)',
  color: 'var(--md-on-surface)',
  fontSize: 'var(--body-large-size)',
  fontFamily: 'var(--font-sans)',
};
const fine: CSSProperties = { margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' };
const https = (s: string) => !s.trim() || /^https:\/\/\S+$/.test(s.trim());

export function RegisterSheet({ open, onClose }: RegisterSheetProps) {
  const { t } = useI18n();
  const wide = useWideLayout();
  const { api, refresh } = useGatherings();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [support, setSupport] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSlug('');
    setSlugEdited(false);
    setDescription('');
    setWebsite('');
    setSupport('');
    setError('');
    setSent(null);
  }, [open]);

  const ok = name.trim().length >= 2 && isSlug(slug) && website.trim() !== '' && https(website) && https(support);
  const submit = async () => {
    if (!api || !ok) return;
    setBusy(true);
    setError('');
    try {
      const req = await api.request({ name, slug, description: description || null, website: website || null, supportUrl: support || null });
      const url = registryIssueUrl({ no: req.no, name: name.trim(), slug: req.slug, website: website.trim() });
      setSent(url);
      void refresh();
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError(gatheringErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    } finally {
      setBusy(false);
    }
  };

  const title = t('Register your group', 'Gruppe registrieren');
  return (
    <Sheet open={open} onClose={onClose} label={title} variant={wide ? 'dialog' : 'sheet'} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 data-autofocus tabIndex={-1} style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 500, outline: 'none' }}>{title}</h2>
        {sent ? (
          <>
            <p style={{ margin: 0 }}>{t('Your request is in. Finish it on GitHub: say your role and add one proof that you speak for the group.', 'Deine Anfrage ist da. Schließe sie auf GitHub ab: deine Rolle und ein Nachweis, dass du für die Gruppe sprichst.')}</p>
            <Button variant="filled" size="large" href={sent} target="_blank" rel="noopener" style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)' }}>{t('Open the form', 'Formular öffnen')}</Button>
            <p style={fine}>{t('A THD AI member who is not you checks the proof. Profile shows the status.', 'Ein THD-AI-Mitglied, das nicht du bist, prüft den Nachweis. Dein Profil zeigt den Stand.')}</p>
            <Button variant="text" onClick={onClose}>{t('Done', 'Fertig')}</Button>
          </>
        ) : (
          <>
            <p style={fine}>{t('For student groups that host gatherings: game nights, talks, meetings, big study sessions. Only public details; this goes into a public GitHub issue.', 'Für Studigruppen mit Treffen: Spieleabende, Vorträge, Treffen, große Lernsessions. Nur öffentliche Angaben; sie landen in einem öffentlichen GitHub-Issue.')}</p>
            <input aria-label={t('Group name', 'Name der Gruppe')} placeholder={t('Group name', 'Name der Gruppe')} value={name} maxLength={60}
              onChange={(e) => { setName(e.target.value); if (!slugEdited) setSlug(slugFrom(e.target.value)); }} style={field} />
            <input aria-label={t('Short name', 'Kurzname')} placeholder="campus-connect" value={slug} maxLength={40}
              onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase()); }} style={{ ...field, fontFamily: 'var(--font-mono)' }} />
            <p style={fine}>{t(`The group's page: /o/${slug || 'short-name'}`, `Die Seite der Gruppe: /o/${slug || 'kurzname'}`)}</p>
            <input aria-label={t('What the group does', 'Was die Gruppe macht')} placeholder={t('What the group does (optional)', 'Was die Gruppe macht (optional)')} value={description} maxLength={280} onChange={(e) => setDescription(e.target.value)} style={field} />
            <input aria-label={t('Official website or account', 'Offizielle Website oder Account')} placeholder={t('Official website or account · https://', 'Offizielle Website oder Account · https://')} value={website} onChange={(e) => setWebsite(e.target.value)} style={field} inputMode="url" />
            <input aria-label={t('Support link', 'Unterstützungs-Link')} placeholder={t('Support link (optional) · https://', 'Unterstützungs-Link (optional) · https://')} value={support} onChange={(e) => setSupport(e.target.value)} style={field} inputMode="url" />
            {error && <p role="alert" style={{ ...fine, color: 'var(--md-error)' }}>{error}</p>}
            <Button variant="filled" size="large" disabled={busy || !ok} onClick={submit} style={{ background: 'var(--md-focus)', color: 'var(--md-on-focus)' }}>
              {t('Continue on GitHub', 'Weiter auf GitHub')}
            </Button>
            <p style={fine}>{t('Nobody registers a group for someone else. Verification is never sold.', 'Niemand registriert eine Gruppe für andere. Verifizierung ist nie käuflich.')}</p>
          </>
        )}
      </div>
    </Sheet>
  );
}
