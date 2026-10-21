import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomCard } from '../../components';
import { useRoomData } from '../rooms/RoomDataContext';
import { useRoomFilters } from '../rooms/RoomFilterContext';
import { useFavorites } from '../favorites/favorites';
import { useI18n } from '../../i18n';
import { formatDayTime, formatTime, freeRoomDuration, roomMeta, statusBannerText } from '../../domain/format';
import { freeStatus } from '../../domain/availability';
import { searchRooms } from '../../domain/roomSearch';
import { favoritesFirst, matchesRoomFilters, mayBeLocked } from '../../domain/roomFilters';
import { focusBucket, rankByBucket } from '../../domain/focusSignals';
import { cardFocus, useBatchLabel, useFocusSignals } from '../focus/useFocusSignals';
import { FocusListNotice } from '../focus/FocusListNotice';
import { BrandHeader } from '../shared/BrandHeader';
import { ClosedNotice } from '../shared/ClosedNotice';
import { TimeControl } from '../shared/TimeControl';
import { FilterMenu } from '../shared/FilterMenu';
import { SearchControl } from '../shared/SearchControl';
import { freeRoomsLabel, opensLabel, roomStatusLabel } from '../shared/roomStatusLabel';
import { Page, Spinner, EmptyState, ErrorState } from '../shared/ui';

export function HomeScreen() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { rooms, events, teachingIdents, freeRooms, planningTime, preview, isCustomTime, campusHours, loading, error, refresh, setQueryTime } =
    useRoomData();
  // Before the buildings open, rooms read "from 06:30", not "free".
  const opensAt = preview && !campusHours.open && campusHours.todayOpen ? formatTime(campusHours.todayOpen) : null;

  const { filters } = useRoomFilters();
  const { isFavorite } = useFavorites();
  const { signalOf, notice } = useFocusSignals();
  const batch = useBatchLabel();
  const [building, setBuilding] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const lockHint = (room: Parameters<typeof mayBeLocked>[0]) =>
    mayBeLocked(room) ? t('may be locked', 'evtl. abgeschlossen') : undefined;

  const buildings = useMemo(() => {
    const set = new Set(freeRooms.map((f) => f.room.building));
    return [...set].sort();
  }, [freeRooms]);

  const shown = useMemo(() => {
    const inBuilding = building ? freeRooms.filter((f) => f.room.building === building) : freeRooms;
    const filtered = inBuilding.filter((f) => matchesRoomFilters(f.room, filters));
    // Free (and your batch) → closing soon → claimed, each in the usual order
    // (#20); saved rooms stay first inside their bucket.
    return rankByBucket(favoritesFirst(filtered, isFavorite), (f) =>
      focusBucket(freeStatus(f.freeUntil, planningTime), signalOf(f.room.ident)),
    );
  }, [freeRooms, building, filters, isFavorite, planningTime, signalOf]);

  // Search spans all teaching rooms (occupied included) and shows live status,
  // so a student who knows the room — or the equipment — can jump to it.
  const searchResults = useMemo(
    () =>
      searching
        ? searchRooms(rooms, events, query, planningTime, {
            eligibleIdents: teachingIdents ?? undefined,
            closesAt: campusHours.todayClose,
          })
        : [],
    [searching, rooms, events, query, planningTime, teachingIdents, campusHours],
  );

  return (
    <>
      <BrandHeader />
      <Page>
        {campusHours.open || preview ? (
          <>
            {/* Plan-ahead banner: the list previews the opening moment. */}
            {preview && campusHours.todayOpen && (
              <div
                style={{
                  background: 'var(--md-surface)',
                  borderRadius: 'var(--radius-l)',
                  boxShadow: 'var(--md-shadow-1)',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--body-medium-size)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                {t(
                  `Campus opens at ${formatTime(campusHours.todayOpen)} — planning ahead`,
                  `Campus öffnet um ${formatTime(campusHours.todayOpen)} — Vorschau`,
                )}
              </div>
            )}

            {/* Answer-first hero → straight into the list. */}
            <div>
              <div
                style={{
                  fontSize: 'clamp(4rem, 22vw, var(--display-large-size))',
                  lineHeight: 1,
                  fontWeight: 'var(--weight-light)',
                  color: 'var(--md-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {(loading || error) && freeRooms.length === 0 ? '—' : searching ? searchResults.length : shown.length}
              </div>
              <div style={{ fontSize: 'var(--title-medium-size)', color: 'var(--md-on-surface-variant)' }}>
                {searching ? t('rooms match', 'Treffer') : freeRoomsLabel(t, { preview, customTime: isCustomTime, building })}
              </div>
            </div>

            {/* One slim toolbar: compact time + search + filters, out of the way. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <TimeControl />
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <SearchControl query={query} onQuery={setQuery} />
                <FilterMenu buildings={buildings} building={building} onBuilding={setBuilding} />
              </div>
            </div>

            {!searching && <FocusListNotice notice={notice} />}

            {/* The answer: search hits (any status) when searching, else free rooms. */}
            {error && freeRooms.length === 0 ? (
              <ErrorState message={t("Can't reach the THD timetable right now. Check your connection and try again.", 'Der THD-Stundenplan ist gerade nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.')} onRetry={refresh} retryLabel={t('Try again', 'Erneut versuchen')} />
            ) : loading && freeRooms.length === 0 ? (
              <Spinner label={t('Checking THabella…', 'THabella wird abgefragt…')} />
            ) : searching ? (
              searchResults.length === 0 ? (
                <EmptyState
                  title={t('No rooms found', 'Keine Räume gefunden')}
                  hint={t('Try a room code, name or equipment.', 'Raumnummer, Name oder Ausstattung versuchen.')}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {searchResults.map(({ room, availability }) => {
                    const b = statusBannerText(availability, planningTime);
                    // A lecture always wins: focus signals only on free rooms.
                    const signal =
                      availability.status === 'occupied'
                        ? { status: availability.status }
                        : cardFocus(signalOf(room.ident), availability.status, planningTime, t, locale, batch);
                    return (
                      <RoomCard
                        key={room.ident}
                        name={room.code}
                        meta={roomMeta(room)}
                        hint={lockHint(room)}
                        status={signal.status}
                        statusLabel={opensAt && signal.status === 'free' ? opensLabel(t, opensAt) : roomStatusLabel(signal.status, t)}
                        focus={'focus' in signal ? signal.focus : undefined}
                        duration={b.duration}
                        href={`/room/${encodeURIComponent(room.ident)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/room/${encodeURIComponent(room.ident)}`);
                        }}
                      />
                    );
                  })}
                </div>
              )
            ) : shown.length === 0 ? (
              <EmptyState
                title={t('No free rooms', 'Keine freien Räume')}
                hint={t('Try another time or filter.', 'Andere Zeit oder Filter versuchen.')}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {shown.map((f) => {
                  const ident = f.room.ident;
                  const signal = cardFocus(signalOf(ident), freeStatus(f.freeUntil, planningTime), planningTime, t, locale, batch);
                  return (
                    <RoomCard
                      key={ident}
                      name={f.room.code}
                      meta={roomMeta(f.room)}
                      hint={lockHint(f.room)}
                      status={signal.status}
                      statusLabel={opensAt && signal.status === 'free' ? opensLabel(t, opensAt) : roomStatusLabel(signal.status, t)}
                      focus={signal.focus}
                      duration={freeRoomDuration(f, planningTime)}
                      href={`/room/${encodeURIComponent(ident)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/room/${encodeURIComponent(ident)}`);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <ClosedNotice hours={campusHours} compact />
            {campusHours.nextOpen && (
              <button
                type="button"
                onClick={() => setQueryTime(campusHours.nextOpen as Date)}
                style={{
                  alignSelf: 'center',
                  minHeight: 'var(--tap-target)',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--md-secondary-container)',
                  color: 'var(--md-on-secondary-container)',
                  borderRadius: 'var(--radius-full, 999px)',
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: 'var(--body-medium-size)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {t(
                  `Plan for ${formatDayTime(campusHours.nextOpen, locale)}`,
                  `Für ${formatDayTime(campusHours.nextOpen, locale)} planen`,
                )}
              </button>
            )}
            <div style={{ display: 'flex' }}>
              <TimeControl />
            </div>
          </>
        )}
      </Page>
    </>
  );
}
