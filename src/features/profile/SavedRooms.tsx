import { useNavigate } from 'react-router-dom';
import { RoomCard } from '../../components';
import { IconStar } from '../../components/icons';
import { useRoomData } from '../rooms/RoomDataContext';
import { useFavorites } from '../favorites/favorites';
import { useI18n } from '../../i18n';
import { computeRoomAvailability, getRoomSchedule } from '../../domain/availability';
import { mayBeLocked } from '../../domain/roomFilters';
import { formatTime, roomMeta, statusBannerText } from '../../domain/format';
import { ClosedNotice } from '../shared/ClosedNotice';
import { roomStatusLabel } from '../shared/roomStatusLabel';

/**
 * Saved rooms on Profile (D2): the student's own order, each with live status.
 * Formerly the Saved tab. Availability is only meaningful while the campus is
 * reachable; when it is closed (and not previewing an opening later today) a
 * saved room is shut, not free, so each card is muted.
 */
export function SavedRooms({ grid = false }: { grid?: boolean }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { rooms, events, planningTime, preview, campusHours } = useRoomData();
  const { favorites } = useFavorites();

  const saved = favorites
    .map((ident) => rooms.find((r) => r.ident === ident))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const showAvailability = campusHours.open || preview;
  const heading = t('Saved rooms', 'Gespeicherte Räume');

  return (
    <section aria-label={heading} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--title-small-size)', fontWeight: 500, color: 'var(--md-on-surface)' }}>
        {heading}
      </h2>
      {favorites.length === 0 ? (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-l)',
            background: 'var(--md-surface)',
            boxShadow: 'var(--md-shadow-1)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          <span aria-hidden="true" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <IconStar size={22} />
          </span>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--md-on-surface)' }}>
              {t('No saved rooms yet', 'Noch keine gespeicherten Räume')}
            </div>
            <div style={{ marginTop: 2, fontSize: 'var(--body-medium-size)' }}>
              {t(
                'Tap the star on any room to see its live status here.',
                'Tippe bei einem Raum auf den Stern, um hier seinen Live-Status zu sehen.',
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {!showAvailability && <ClosedNotice hours={campusHours} compact />}
          {showAvailability && preview && campusHours.todayOpen && (
            <div
              style={{
                background: 'var(--md-surface-1)',
                borderRadius: 'var(--radius-l)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--body-medium-size)',
                color: 'var(--md-on-surface-variant)',
                textAlign: 'center',
              }}
            >
              {t(
                `Campus opens at ${formatTime(campusHours.todayOpen)} — planning ahead`,
                `Campus öffnet um ${formatTime(campusHours.todayOpen)} — Vorschau`,
              )}
            </div>
          )}
          <div
            style={
              grid
                ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-2)' }
                : { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }
            }
          >
            {saved.map((room) => {
              const href = `/room/${encodeURIComponent(room.ident)}`;
              const open = (e: { preventDefault: () => void }) => {
                e.preventDefault();
                navigate(href);
              };
              if (!showAvailability) {
                return (
                  <RoomCard
                    key={room.ident}
                    name={room.code}
                    meta={roomMeta(room)}
                    status="occupied"
                    statusLabel={t('closed', 'zu')}
                    duration="—"
                    href={href}
                    onClick={open}
                  />
                );
              }
              const availability = computeRoomAvailability(
                getRoomSchedule(events, room.ident),
                planningTime,
                campusHours.todayClose,
              );
              const banner = statusBannerText(availability, planningTime);
              return (
                <RoomCard
                  key={room.ident}
                  name={room.code}
                  meta={roomMeta(room)}
                  hint={mayBeLocked(room) ? t('may be locked', 'evtl. abgeschlossen') : undefined}
                  status={availability.status}
                  statusLabel={roomStatusLabel(availability.status, t)}
                  duration={banner.duration ?? ''}
                  href={href}
                  onClick={open}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
