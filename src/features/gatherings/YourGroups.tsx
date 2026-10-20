import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, TableRow, TableTag, VerifiedTag } from '../../components';
import { registryIssueLink } from '../../domain/gatherings';
import { useI18n } from '../../i18n';
import { useStudyProfile } from '../profile/StudyProfileContext';
import { useGatherings } from './GatheringsContext';
import { RegisterSheet } from './RegisterSheet';
import { requestStatusText } from './copy';

/**
 * Profile → Student groups (O1–O3): the groups the student organizes for
 * and their open registry requests with the same status as the issue. With
 * neither, just the Register your group button.
 */
const box: CSSProperties = { borderRadius: 'var(--radius-l)', background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', overflow: 'hidden' };

export function YourGroups() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { api, orgs } = useGatherings();
  const profile = useStudyProfile();
  const [open, setOpen] = useState(false);
  // "More people? Register your group" from Set a table lands here.
  const { search } = useLocation();
  useEffect(() => {
    if (new URLSearchParams(search).has('register')) {
      setOpen(true);
      navigate('/profile', { replace: true });
    }
  }, [search]);
  if (!api || !profile.identity) return null;

  const requests = orgs.requests.filter((r) => r.status !== 'approved' || !orgs.groups.some((g) => g.slug === r.slug));
  const rows = orgs.groups.length + requests.length;
  const register = (
    <Button variant="text" onClick={() => setOpen(true)} style={{ alignSelf: rows ? 'flex-start' : 'center', minHeight: 48 }}>
      {t('Register your group', 'Gruppe registrieren')}
    </Button>
  );

  return (
    <>
      {rows === 0 ? (
        register
      ) : (
        <section aria-label={t('Student groups', 'Studigruppen')} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--title-small-size)', fontWeight: 500 }}>{t('Student groups', 'Studigruppen')}</h2>
          <div style={box}>
            {orgs.groups.map((g, i) => (
              <TableRow
                key={g.slug}
                ring={<VerifiedTag name="" verified={g.verified} verifiedLabel={t('Verified', 'Verifiziert')} style={{ width: 44, justifyContent: 'center' }} />}
                title={g.name}
                meta={g.role === 'lead' ? t('You lead it', 'Du leitest sie') : t('You organize', 'Du organisierst')}
                onClick={() => navigate(`/o/${g.slug}`)}
                style={i ? { borderTop: '1px solid var(--md-outline-variant)' } : undefined}
              />
            ))}
            {requests.map((r, i) => (
              <TableRow
                key={r.no}
                ring={<span style={{ width: 44, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--md-on-surface-variant)' }}>#{r.no}</span>}
                title={r.name}
                meta={t('Registry request', 'Registrierungsanfrage')}
                tag={<TableTag tone={r.status === 'declined' || r.status === 'revoked' ? 'alert' : r.status === 'needs_info' ? 'info' : 'focus'}>{requestStatusText(r.status, t)}</TableTag>}
                onClick={r.issueNumber ? () => window.open(registryIssueLink(r.issueNumber as number), '_blank', 'noopener') : undefined}
                style={orgs.groups.length + i ? { borderTop: '1px solid var(--md-outline-variant)' } : undefined}
              />
            ))}
          </div>
          {register}
        </section>
      )}
      <RegisterSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
