import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AppBar, Button, KindIcon, Snackbar, TableRow, VerifiedTag } from '../../components';
import { ServiceError } from '../../data/identityApi';
import type { Organization } from '../../data/gatheringsApi';
import { isSlug } from '../../domain/gatherings';
import { tableShortWhen } from '../../domain/tables';
import { useI18n } from '../../i18n';
import { PUBLIC_ORIGIN } from '../focus/shareSnapshot';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { SetupSheet } from '../profile/SetupSheet';
import { Page, Spinner, EmptyState } from '../shared/ui';
import { useGatherings } from './GatheringsContext';
import { gatheringErrorText, kindLabels } from './copy';

/**
 * A group's page (O15): name, verified tag, description, website, its
 * upcoming gatherings and, if it has one, its own support link. Leads share
 * an organizer link here; opening one (`?join=<token>`) adds a signed-in
 * student as organizer (O5).
 */
const card: CSSProperties = { background: 'var(--md-surface)', borderRadius: 'var(--radius-l)', boxShadow: 'var(--md-shadow-1)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 };
const fine: CSSProperties = { margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' };
const glyph: CSSProperties = { width: 44, height: 44, borderRadius: '50%', background: 'var(--md-focus-container)', color: 'var(--md-focus)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

export function OrganizationScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { t, locale } = useI18n();
  const { api, orgs, refresh } = useGatherings();
  const profile = useStudyProfile();
  const [org, setOrg] = useState<Organization | null | undefined>(undefined);
  const [snack, setSnack] = useState('');
  const [signIn, setSignIn] = useState(false);
  const joinTried = useRef(false);
  const slug = (params.slug ?? '').toLowerCase();
  const token = new URLSearchParams(search).get('join');

  // Not found and couldn't load are different answers.
  const [failed, setFailed] = useState(false);
  const load = async () => {
    if (!api || !isSlug(slug)) return setOrg(null);
    try {
      setFailed(false);
      setOrg(await api.organization(slug));
    } catch {
      setFailed(true);
    }
  };
  useEffect(() => {
    void load();
  }, [api, slug, profile.email]);

  // An organizer link: sign in if needed, then join.
  useEffect(() => {
    if (!api || !token || joinTried.current) return;
    if (!profile.identity) {
      if (!signIn) setSignIn(true);
      return;
    }
    joinTried.current = true;
    api
      .join(token)
      .then((g) => {
        setSnack(t(`You're an organizer for ${g.name} now`, `Du organisierst jetzt für ${g.name}`));
        void refresh();
        void load();
      })
      .catch((e) => setSnack(gatheringErrorText(e instanceof ServiceError ? e.code : 'unknown', t)))
      .finally(() => navigate(`/o/${slug}`, { replace: true }));
  }, [api, token, profile.identity]);

  const lead = orgs.groups.some((g) => g.slug === slug && g.role === 'lead');
  const invite = async () => {
    if (!api) return;
    try {
      const { token: tk } = await api.invite(slug);
      const url = `${(Capacitor.isNativePlatform() ? PUBLIC_ORIGIN : window.location.origin).replace(/\/$/, '')}/o/${slug}?join=${tk}`;
      if (typeof navigator.share === 'function') await navigator.share({ title: t('Organizer link', 'Organisations-Link'), url });
      else {
        await navigator.clipboard.writeText(url);
        setSnack(t('Organizer link copied · valid 7 days', 'Organisations-Link kopiert · 7 Tage gültig'));
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setSnack(gatheringErrorText(e instanceof ServiceError ? e.code : 'unknown', t));
    }
  };

  const bar = <AppBar mode="back" title={org?.name ?? t('Group', 'Gruppe')} onBack={() => (history.length > 1 ? navigate(-1) : navigate('/'))} style={{ position: 'sticky', top: 0, zIndex: 10 }} />;
  if (failed && !org) {
    return (
      <>
        {bar}
        <EmptyState title={t("Couldn't load this group", 'Gruppe konnte nicht geladen werden')} hint={t('Check your connection and try again.', 'Prüfe deine Verbindung und versuche es erneut.')} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Button variant="filled" onClick={() => { setOrg(undefined); void load(); }}>{t('Try again', 'Erneut versuchen')}</Button>
          <Button variant="tonal" onClick={() => navigate('/')}>{t('Find a free room', 'Freien Raum finden')}</Button>
        </div>
      </>
    );
  }
  if (org === undefined) return <>{bar}<Spinner /></>;
  if (!org) return <>{bar}<EmptyState title={t("This group isn't here", 'Diese Gruppe gibt es nicht')} hint={t('Check the link.', 'Prüfe den Link.')} /></>;

  const labels = kindLabels(t);
  const now = new Date();
  return (
    <>
      {bar}
      <Page>
        <section style={card}>
          <VerifiedTag name={org.verified ? t('Verified', 'Verifiziert') : t('No longer verified', 'Nicht mehr verifiziert')} verified={org.verified} verifiedLabel={t('Verified', 'Verifiziert')} />
          <h1 style={{ margin: 0, fontSize: 'var(--headline-size)', fontWeight: 500 }}>{org.name}</h1>
          {org.description && <p style={{ margin: 0, color: 'var(--md-on-surface-variant)' }}>{org.description}</p>}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {org.website && <Button variant="text" href={org.website} target="_blank" rel="noopener">{t('Website', 'Website')}</Button>}
            {org.supportUrl && <Button variant="tonal" href={org.supportUrl} target="_blank" rel="noopener">{t(`Support ${org.name}`, `${org.name} unterstützen`)}</Button>}
            {lead && <Button variant="text" onClick={() => void invite()}>{t('Organizer link', 'Organisations-Link')}</Button>}
          </div>
          {org.supportUrl && <p style={fine}>{t('Support goes to this group only. The app takes no share.', 'Unterstützung geht nur an diese Gruppe. Die App behält nichts.')}</p>}
        </section>
        <h2 style={{ margin: 0, fontSize: 'var(--title-small-size)', fontWeight: 500 }}>{t('Coming up', 'Demnächst')}</h2>
        {org.gatherings.length === 0 ? (
          <p style={{ ...card, margin: 0, color: 'var(--md-on-surface-variant)' }}>{t('No gatherings planned yet.', 'Noch keine Treffen geplant.')}</p>
        ) : (
          <div style={{ ...card, padding: 0, gap: 0, overflow: 'hidden' }}>
            {org.gatherings.map((g, i) => (
              <TableRow
                key={g.link}
                ring={<span style={glyph}><KindIcon kind={g.kind} /></span>}
                title={g.title}
                meta={`${tableShortWhen(g.startsAt, locale, now)} · ${g.roomCode ?? ''} · ${labels[g.kind]}`}
                onClick={() => navigate(`/g/${g.link}`)}
                style={i ? { borderTop: '1px solid var(--md-outline-variant)' } : undefined}
              />
            ))}
          </div>
        )}
        <p style={fine}>
          {t('Verified in the public registry: ', 'Verifiziert im öffentlichen Register: ')}
          <a href="https://github.com/THD-AI/organizations" target="_blank" rel="noopener" style={{ color: 'var(--md-primary)' }}>THD-AI/organizations</a>
        </p>
      </Page>
      <SetupSheet quick open={signIn} onClose={() => setSignIn(false)} />
      <Snackbar message={snack} onClose={() => setSnack('')} bottom={96} />
    </>
  );
}
