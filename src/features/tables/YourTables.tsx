import { useNavigate } from 'react-router';
import { Button, KindIcon, SeatRing, TableRow, TableTag } from '../../components';
import type { Gathering } from '../../data/gatheringsApi';
import type { StudyTable } from '../../data/tablesApi';
import { tableShortWhen, tableState } from '../../domain/tables';
import { useI18n } from '../../i18n';
import type { Translate } from '../../i18n';
import { useTables } from './TablesContext';
import { useGatherings } from '../gatherings/GatheringsContext';
import { kindLabels } from '../gatherings/copy';
import { seatsTitle, topicOf } from './copy';

/**
 * Profile → Your tables (S3, T14): tables the student hosts, sits at or said
 * maybe to, and gatherings they replied to or organize (G3), next first;
 * each with a small ring (or the gathering's kind) and at most one chip. A
 * list on phones, a grid of cards on wide windows. They drop off when over.
 * Profile shows the list at the top while there are tables (`when="some"`)
 * and the empty state above Saved rooms otherwise (`when="none"`). When the
 * service can't be reached it shows the last list from this device with a
 * line saying so, or says it couldn't load them, never "No tables yet".
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

const glyph = {
  borderRadius: '50%',
  background: 'var(--md-focus-container)',
  color: 'var(--md-focus)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
} as const;

export function gatheringChip(g: Gathering, now: Date, t: Translate) {
  const state = tableState(g, now);
  if (state === 'cancelled') return <TableTag tone="alert">{t('Cancelled', 'Abgesagt')}</TableTag>;
  if (state === 'live') return <TableTag tone="focus">{t('Now', 'Jetzt')}</TableTag>;
  if (state === 'soon') return <TableTag tone="focus">{t('Soon', 'Gleich')}</TableTag>;
  if (g.isOrganizer) return <TableTag tone="info">{t('Organizing', 'Organisierst du')}</TableTag>;
  if (g.myAnswer === 'going') return <TableTag tone="info">{t('Going', 'Dabei')}</TableTag>;
  if (g.myAnswer === 'maybe') return <TableTag tone="info">{t('Maybe', 'Vielleicht')}</TableTag>;
  if (g.myAnswer === 'waiting') return <TableTag tone="info">{t('Waiting', 'Warteliste')}</TableTag>;
  return undefined;
}

export function YourTables({ grid = false, when }: { grid?: boolean; when?: 'some' | 'none' }) {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { api, mine, failed: tablesFailed, refresh } = useTables();
  const gatherings = useGatherings();
  const failed = tablesFailed || gatherings.failed;
  const retry = () => void Promise.all([refresh(), gatherings.refresh()]);
  const now = new Date();
  if (!api) return null;
  const heading = t('Your study tables', 'Deine Lerntische');
  type Item = { kind: 'table'; at: number; table: StudyTable } | { kind: 'gathering'; at: number; g: Gathering };
  const list: Item[] = [
    ...mine.filter((x) => tableState(x, now) !== 'ended').map((x) => ({ kind: 'table' as const, at: x.startsAt.getTime(), table: x })),
    ...gatherings.mine.filter((g) => tableState(g, now) !== 'ended').map((g) => ({ kind: 'gathering' as const, at: g.startsAt.getTime(), g })),
  ].sort((a, b) => a.at - b.at);
  if ((when === 'some' && !list.length) || (when === 'none' && list.length)) return null;
  const labels = kindLabels(t);

  return (
    <section aria-label={heading} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--title-small-size)', fontWeight: 500, color: 'var(--md-on-surface)' }}>{heading}</h2>
      {failed && list.length > 0 && (
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-on-surface-variant)', fontSize: 'var(--body-small-size)' }}>
          <span style={{ flex: 1 }}>{t("Couldn't refresh. Showing what this device saw last.", 'Aktualisieren ging nicht. Du siehst den letzten Stand auf diesem Gerät.')}</span>
          <Button variant="text" onClick={retry}>{t('Try again', 'Erneut versuchen')}</Button>
        </p>
      )}
      {list.length === 0 && failed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-4)', borderRadius: 'var(--radius-l)', background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--body-medium-size)' }}>
          <span style={{ flex: 1 }}>{t("Couldn't load your study tables.", 'Deine Lerntische konnten nicht geladen werden.')}</span>
          <Button variant="text" onClick={retry}>{t('Try again', 'Erneut versuchen')}</Button>
        </div>
      ) : list.length === 0 ? (
        <p style={{ margin: 0, padding: 'var(--space-4)', borderRadius: 'var(--radius-l)', background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--body-medium-size)' }}>
          {t('No study tables yet. Open a free room and tap Study together.', 'Noch keine Lerntische. Öffne einen freien Raum und tippe auf Zusammen lernen.')}
        </p>
      ) : (
        <div
          style={
            grid
              ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }
              : { borderRadius: 'var(--radius-l)', background: 'var(--md-surface)', boxShadow: 'var(--md-shadow-1)', overflow: 'hidden' }
          }
        >
          {list.map((item, i) => {
            const divider = !grid && i > 0 ? { borderTop: '1px solid var(--md-outline-variant)' } : undefined;
            if (item.kind === 'gathering') {
              const g = item.g;
              return (
                <TableRow
                  key={g.link}
                  card={grid}
                  ring={<span style={{ ...glyph, width: grid ? 72 : 44, height: grid ? 72 : 44 }}><KindIcon kind={g.kind} size={grid ? 32 : 24} /></span>}
                  title={g.title}
                  meta={`${tableShortWhen(g.startsAt, locale, now)} · ${g.roomCode ?? ''} · ${g.org.name}`}
                  detail={labels[g.kind]}
                  tag={gatheringChip(g, now, t)}
                  struck={g.cancelled}
                  onClick={() => navigate(`/g/${g.link}`)}
                  style={divider}
                />
              );
            }
            const x = item.table;
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
                style={divider}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
