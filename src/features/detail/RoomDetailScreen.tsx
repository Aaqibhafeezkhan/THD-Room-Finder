import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar, Button, IconButton, SeatRing, StatusCard, TableRow } from '../../components';
import { IconMail, IconStar, IconStarFilled, IconUsers } from '../../components/icons';
import { useRoomData } from '../rooms/RoomDataContext';
import { useFavorites } from '../favorites/favorites';
import { useI18n } from '../../i18n';
import { computeRoomAvailability, getRoomSchedule } from '../../domain/availability';
import { mayBeLocked } from '../../domain/roomFilters';
import { formatTime, statusBannerText } from '../../domain/format';
import { Page, Spinner, EmptyState, ErrorState } from '../shared/ui';
import { ClosedNotice } from '../shared/ClosedNotice';
import { RoomFocusPanel } from '../focus/RoomFocusPanel';
import { useTableFlow } from '../tables/useTableFlow';
import { RoomGatherings } from '../gatherings/RoomGatherings';
import { useTables } from '../tables/TablesContext';
import { tableChip } from '../tables/YourTables';
import { seatsTitle, topicOf } from '../tables/copy';
import { tableShortWhen, tableState } from '../../domain/tables';
import { toRoom } from '../../data/mappers';
import { useFocusSession } from '../focus/FocusSessionContext';

const stickyBar = { position: 'sticky' as const, top: 0, zIndex: 10 };

export function RoomDetailScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { rooms, events, queryTime, campusHours, loading, schedule, scheduleAt, refresh, isCustomTime } = useRoomData();
  const { isFavorite, toggle } = useFavorites();
  const { active } = useFocusSession();

  const ident = decodeURIComponent(params.ident ?? '');
  // A running session's room stays reachable even if no room list has it
  // (THabella down on a first visit), so End and confirm always work (#154).
  const room =
    rooms.find((r) => r.ident === ident) ??
    (active?.roomIdent === ident ? toRoom({ id: 0, ident, name: active.roomCode }) : undefined);
  const unknown = schedule === 'unavailable';
  const tableFlow = useTableFlow(room);
  const { mine } = useTables();

  const back = () => navigate(-1);

  if (!room) {
    return (
      <>
        <AppBar mode="back" backLabel={t('Back', 'Zurück')} title="" onBack={back} style={stickyBar} />
        {loading ? (
          <Spinner />
        ) : unknown ? (
          <ErrorState message={t("This room isn't in the rooms this device knows, and the THD timetable isn't answering.", 'Dieser Raum ist auf diesem Gerät nicht bekannt, und der THD-Stundenplan antwortet nicht.')} onRetry={refresh} retryLabel={t('Try again', 'Erneut versuchen')} />
        ) : (
          <EmptyState
            title={t('Room not found', 'Raum nicht gefunden')}
            hint={t('It may not be in this week’s schedule.', 'Er ist evtl. nicht im Wochenplan.')}
          />
        )}
      </>
    );
  }

  const roomEvents = getRoomSchedule(events, ident);
  const availability = unknown
    ? { status: 'free' as const, freeUntil: null, occupiedUntil: null }
    : computeRoomAvailability(roomEvents, queryTime, campusHours.todayClose);
  const banner = statusBannerText(availability, queryTime, locale);
  const occupied = availability.status === 'occupied';
  const titles = {
    occupied: isCustomTime ? t('Occupied at this time', 'Zu dieser Zeit belegt') : t('Occupied now', 'Jetzt belegt'),
    soon: t('Closing soon', 'Bald belegt'),
    free: isCustomTime ? t('Free at this time', 'Zu dieser Zeit frei') : t('Free now', 'Jetzt frei'),
  };
  let subtitle: string | undefined;
  if (occupied && availability.occupiedUntil) {
    subtitle = t(`Free again at ${formatTime(availability.occupiedUntil)}`, `Wieder frei ab ${formatTime(availability.occupiedUntil)}`);
  } else if (!occupied && availability.freeUntil) {
    subtitle = t(`Free until ${formatTime(availability.freeUntil)}`, `Frei bis ${formatTime(availability.freeUntil)}`);
  } else if (!occupied) {
    subtitle = t('Free for the rest of the day', 'Für den Rest des Tages frei');
  }
  const duration = occupied && availability.occupiedUntil
    ? t(`until ${formatTime(availability.occupiedUntil)}`, `bis ${formatTime(availability.occupiedUntil)}`)
    : banner.duration;
  const closed = !campusHours.open;
  const fav = isFavorite(ident);

  const dayLabel = new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(queryTime);

  return (
    <>
      <AppBar
        mode="back" backLabel={t('Back', 'Zurück')}
        title={room.code}
        onBack={back}
        style={stickyBar}
        actions={
          <IconButton
            label={fav ? t('Remove from saved', 'Aus Gespeicherten entfernen') : t('Save room', 'Raum speichern')}
            tone={fav ? 'primary' : 'standard'}
            onClick={() => toggle(ident)}
            style={{ marginRight: '0.25rem' }}
          >
            {fav ? <IconStarFilled size={22} /> : <IconStar size={22} />}
          </IconButton>
        }
      />
      <Page>
        {closed ? (
          <ClosedNotice hours={campusHours} compact />
        ) : unknown ? (
          <StatusCard
            status="unknown"
            title={t('Availability unknown', 'Verfügbarkeit unbekannt')}
            sub={t("The THD timetable isn't answering, so a lecture here can't be ruled out. Check the door.", 'Der THD-Stundenplan antwortet nicht, eine Vorlesung hier ist also nicht ausgeschlossen. Prüfe vor Ort.')}
          />
        ) : (
          <StatusCard
            status={banner.status}
            title={titles[banner.status]}
            sub={subtitle}
            duration={duration}
          />
        )}

        <RoomFocusPanel
          room={room}
          availability={availability}
          closing={campusHours.todayClose}
          scheduleOnly={closed || isCustomTime}
          scheduleUnknown={unknown}
        />
        {tableFlow.available && (
          <Button variant="tonal" size="large" onClick={tableFlow.start} style={{ alignSelf: 'stretch' }}>
            {t('Study together', 'Zusammen lernen')}
          </Button>
        )}
        {/* My tables in this room, next first (where things live: room detail). */}
        {mine
          .filter((x) => x.roomKey === `thd:${room.ident}` && tableState(x, new Date()) !== 'ended')
          .slice(0, 2)
          .map((x) => (
            <TableRow
              key={x.link}
              card
              ring={<SeatRing seats={x.seats} taken={x.taken} mine={x.isHost ? 0 : x.taken - 1} size={44} cancelled={x.cancelled} title={seatsTitle(x, t)} />}
              title={x.isHost ? t(`Your study table · ${topicOf(x, t)}`, `Dein Lerntisch · ${topicOf(x, t)}`) : topicOf(x, t)}
              meta={tableShortWhen(x.startsAt, locale, new Date())}
              tag={tableChip(x, new Date(), t)}
              onClick={() => navigate(`/t/${x.link}`)}
            />
          ))}
        <RoomGatherings room={room} />

        {/* Identity + facilities. */}
        <div
          style={{
            background: 'var(--md-surface)',
            borderRadius: 'var(--radius-l)',
            boxShadow: 'var(--md-shadow-1)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ fontWeight: 500, fontSize: 'var(--title-large-size)' }}>
            {room.displayName || room.code}
          </div>
          <InfoRow icon={<IconUsers size={18} />} text={`${room.seatsRegular} ${t('seats', 'Plätze')}`} />
          {mayBeLocked(room) && (
            <div
              style={{
                fontSize: 'var(--body-small-size)',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              {t(
                'May be locked when no class is scheduled — check before relying on it.',
                'Evtl. abgeschlossen, wenn kein Kurs stattfindet — vorher prüfen.',
              )}
            </div>
          )}
          {room.facilities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {room.facilities.map((f) => (
                <span
                  key={f}
                  style={{
                    background: 'var(--md-surface-variant)',
                    color: 'var(--md-on-surface-variant)',
                    borderRadius: 'var(--radius-s)',
                    padding: '0.2rem 0.6rem',
                    fontSize: 'var(--body-small-size)',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
          {room.inChargeEmail && (
            <a
              href={`mailto:${room.inChargeEmail}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--md-primary)',
                fontSize: 'var(--body-medium-size)',
              }}
            >
              <IconMail size={18} />
              {room.inChargeName ?? room.inChargeEmail}
            </a>
          )}
        </div>

        {/* Day schedule. */}
        <div>
          <div
            style={{
              fontWeight: 500,
              fontSize: 'var(--title-medium-size)',
              marginBottom: 'var(--space-2)',
            }}
          >
            {t('Schedule', 'Stundenplan')} — {dayLabel}
            {schedule === 'stale' && scheduleAt && (
              <span style={{ fontWeight: 400, fontSize: 'var(--body-small-size)', color: 'var(--md-on-surface-variant)' }}>
                {' · '}{t(`as of ${formatTime(scheduleAt)}`, `Stand ${formatTime(scheduleAt)}`)}
              </span>
            )}
          </div>
          <div
            style={{
              background: 'var(--md-surface)',
              borderRadius: 'var(--radius-l)',
              boxShadow: 'var(--md-shadow-1)',
              overflow: 'hidden',
            }}
          >
            {unknown ? (
              <div role="status" style={{ padding: 'var(--space-4)', color: 'var(--md-on-surface-variant)' }}>
                {t("Timetable unavailable right now", 'Stundenplan gerade nicht verfügbar')}
              </div>
            ) : roomEvents.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', color: 'var(--md-on-surface-variant)' }}>
                {t('No events scheduled', 'Keine Termine')}
              </div>
            ) : (
              roomEvents.map((e, i) => {
                const active = e.startDateTime <= queryTime && e.endDateTime > queryTime;
                return (
                  <div
                    key={`${e.id}-${i}`}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderTop: i === 0 ? 'none' : '1px solid var(--md-outline-variant)',
                      background: active ? 'var(--md-error-container)' : 'transparent',
                      color: active ? 'var(--md-on-error-container)' : 'inherit',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 'var(--body-medium-size)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatTime(e.startDateTime)}–{formatTime(e.endDateTime)}
                    </span>
                    <span style={{ fontSize: 'var(--body-medium-size)' }}>{e.eventType}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Page>
      {tableFlow.element}
    </>
  );
}

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        color: 'var(--md-on-surface-variant)',
      }}
    >
      {icon}
      <span style={{ color: 'var(--md-on-surface)' }}>{text}</span>
    </div>
  );
}
