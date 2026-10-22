import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Sheet, choiceChip } from '../../components';
import type { GatheringAnswer, Person } from '../../data/gatheringsApi';
import { personBatch } from '../../domain/gatherings';
import { useI18n } from '../../i18n';
import { useWideLayout } from '../../lib/useWindowClass';

/**
 * People (O13): organizers only. Who replied, filtered by reply, in reply
 * order, with the name, programme and batch they agreed to share. No email
 * addresses.
 */
export interface PeopleSheetProps {
  open: boolean;
  onClose: () => void;
  people: Person[];
  title: string;
}

const cell: CSSProperties = { padding: '10px 4px', borderTop: '1px solid var(--md-outline-variant)', fontSize: 'var(--body-medium-size)' };

export function PeopleSheet({ open, onClose, people, title }: PeopleSheetProps) {
  const { t, locale } = useI18n();
  const wide = useWideLayout();
  const [filter, setFilter] = useState<GatheringAnswer>('going');
  const now = new Date();
  const count = (a: GatheringAnswer) => people.filter((p) => p.answer === a).length;
  const shown = people.filter((p) => p.answer === filter);
  const when = (d: Date) => new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
  const filters: [GatheringAnswer, string][] = [
    ['going', t(`Going ${count('going')}`, `Dabei ${count('going')}`)],
    ['maybe', t(`Maybe ${count('maybe')}`, `Vielleicht ${count('maybe')}`)],
    ['waiting', t(`Waiting ${count('waiting')}`, `Warteliste ${count('waiting')}`)],
  ];

  return (
    <Sheet open={open} onClose={onClose} label={t(`People · ${title}`, `Personen · ${title}`)} variant={wide ? 'dialog' : 'sheet'} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--title-large-size)', fontWeight: 500 }}>{t('People', 'Personen')}</h2>
        <div role="radiogroup" aria-label={t('Reply', 'Antwort')} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filters.map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={filter === id} onClick={() => setFilter(id)} style={choiceChip(filter === id, 'focus')}>
              {label}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--md-on-surface-variant)' }}>{t('Nobody yet.', 'Noch niemand.')}</p>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {shown.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...cell, fontWeight: 500 }}>{p.name ?? t('No name', 'Ohne Namen')}</td>
                  <td style={cell}>{personBatch(p, now)}</td>
                  <td style={{ ...cell, textAlign: 'right', color: 'var(--md-on-surface-variant)' }}>{when(p.repliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ margin: 0, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' }}>
          {t('Only organizers see this list. Exports have no email addresses. Deleted 30 days after the gathering.', 'Nur das Organisationsteam sieht diese Liste. Exporte enthalten keine E-Mail-Adressen. Gelöscht 30 Tage nach dem Treffen.')}
        </p>
      </div>
    </Sheet>
  );
}
