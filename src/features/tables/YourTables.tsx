import { useNavigate } from 'react-router-dom';
import { SeatRing, TableRow, TableTag } from '../../components';
import type { StudyTable } from '../../data/tablesApi';
import { tableShortWhen, tableState } from '../../domain/tables';
import { useI18n } from '../../i18n';
import type { Translate } from '../../i18n';
import { useTables } from './TablesContext';
import { seatsTitle, topicOf } from './copy';

/**
 * Profile → Your tables (S3, T14): tables the student hosts, sits at or said
 * maybe to, next first; each with a small ring and at most one chip. A list
 * on phones, a grid of cards on wide windows. Tables drop off when they end.
 */
export function tableChip(table: StudyTable, now: Date, t: Translate) {
  const state = tableState(table, now);
  if (state === 'cancelled') return <TableTag tone="alert">{t('Cancelled', 'Abgesagt')}</TableTag>;
  if (state === 'live') return <TableTag tone="focus">{t('Now', 'Jetzt')}</TableTag>;
  if (state === 'soon') return <TableTag tone="focus">{t('Soon', 'Gleich')}</TableTag>;
  if (table.changed) return <TableTag tone="info">{t('Changed', 'Geändert')}</TableTag>;
  if (table.myAnswer === 'maybe') return <TableTag tone="info">{t('Maybe', 'Vielleicht')}</TableTag>;
  return undefined;
}

export function YourTables({ grid = false }: { grid?: boolean }) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { api, mine } = useTables();
  const now = new Date();
  if (!api) return null;
  const heading = t('Your tables', 'Deine Tische');
  const list = mine.filter((x) => tableState(x, now) !== 'ended');

  return (
    <section aria-label={heading} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--title-small-size)', fontWeight: 500, color: 'var(--md-on-surface)' }}>{heading}</h2>
      {list.length === 0 ? (
        <p style={{ margin: 0, padding: 'var(--space-4)', borderRadius: 'var(--radius-l)', background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--body-medium-size)' }}>
          {t('No tables yet. Open a free room and tap Set a table.', 'Noch keine Tische. Öffne einen freien Raum und tippe auf Lerntisch anlegen.')}
        </p>
      ) : (
        <div
          style={
            grid
              ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }
              : { borderRadius: 'var(--radius-l)', background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', overflow: 'hidden' }
          }
        >
          {list.map((x, i) => {
            const mineAt = x.isHost ? 0 : x.myAnswer === 'seat' ? Math.max(0, x.taken - 1) : null;
            const where = x.roomCode ?? '';
            const seatsLine = x.seats === 1 ? t('Planned solo session', 'Geplante Solo-Session') : t(`${x.taken} of ${x.seats}`, `${x.taken} von ${x.seats}`);
            return (
              <TableRow
                key={x.link}
                card={grid}
                ring={<SeatRing seats={x.seats} taken={x.taken} mine={mineAt} size={grid ? 72 : 44} cancelled={x.cancelled} title={seatsTitle(x, t)} />}
                title={topicOf(x, t)}
                meta={grid ? `${tableShortWhen(x.startsAt, locale, now)} · ${where}` : `${tableShortWhen(x.startsAt, locale, now)} · ${where}${x.seats > 1 ? ` · ${seatsLine}` : ''}`}
                detail={seatsLine}
                tag={tableChip(x, now, t)}
                struck={x.cancelled}
                onClick={() => navigate(`/t/${x.link}`)}
                style={!grid && i > 0 ? { borderTop: '1px solid var(--md-outline-variant)' } : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
