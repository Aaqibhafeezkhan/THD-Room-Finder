import { lazy, Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AdaptiveNav, CheckInSheet } from '../components';
import { useFocusSession } from '../features/focus/FocusSessionContext';
import { sessionView } from '../features/focus/sessionView';
import { FocusNotifications } from '../features/focus/FocusNotifications';
import { LectureGuard } from '../features/focus/LectureGuard';
import { AppUpdates } from '../features/update/AppUpdates';
import type { NavItem } from '../components';
import { IconList, IconMap } from '../components/icons';
import { IconPerson } from '../components/focus/focusIcons';
import { useNavigationVariant } from '../lib/useWindowClass';
import { useI18n } from '../i18n';
import { HomeScreen } from '../features/home/HomeScreen';
import { CampusScreen } from '../features/campus/CampusScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { RoomDetailScreen } from '../features/detail/RoomDetailScreen';
import { TableScreen } from '../features/tables/TableScreen';
import { TableReminder } from '../features/tables/TableReminder';
import { GatheringScreen } from '../features/gatherings/GatheringScreen';
import { OrganizationScreen } from '../features/gatherings/OrganizationScreen';
import { activeId } from './activeTab';
import { ErrorBoundary } from './ErrorBoundary';

// Component specimen for `npm run dev` and Vercel previews; the import is
// dropped from production builds because the condition is a build-time
// constant.
const FocusGallery = import.meta.env.DEV || __DEV_GALLERY__
  ? lazy(() => import('../features/dev/FocusGallery').then((m) => ({ default: m.FocusGallery })))
  : null;

export function AppShell() {
  const variant = useNavigationVariant();
  const wide = variant !== 'bar';
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const page = useRef<HTMLElement>(null);
  const tab = useRef('campus');
  tab.current = activeId(location.pathname, tab.current);
  useLayoutEffect(() => {
    // Profile and Settings open at their heading; rotations keep the current position.
    if (location.pathname.startsWith('/profile') && page.current) page.current.scrollTop = 0;
  }, [location.pathname]);
  const focus = useFocusSession();
  const checkIn =
    focus.active && focus.plan && focus.status ? sessionView(focus.active, focus.plan, focus.status, focus.now, t) : null;

  const items = useMemo<NavItem[]>(
    () => [
      { id: 'campus', label: t('Campus', 'Campus'), icon: <IconMap /> },
      { id: 'rooms', label: t('Rooms', 'Räume'), icon: <IconList /> },
      { id: 'profile', label: t('Profile', 'Profil'), icon: <IconPerson size={24} /> },
    ],
    [t],
  );

  const onSelect = (id: string) => {
    navigate(id === 'campus' ? '/' : `/${id}`);
  };

  const nav = (
    <AdaptiveNav key="navigation"
      items={items}
      active={tab.current}
      onSelect={onSelect}
      variant={variant}
    />
  );

  const content = (
    <main ref={page} key="page-content" style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
      <ErrorBoundary inShell resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<CampusScreen />} />
        <Route path="/rooms" element={<HomeScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/profile/settings" element={<SettingsScreen />} />
        {/* The Saved tab became part of Profile (#37); old links still work. */}
        <Route path="/saved" element={<Navigate to="/profile" replace />} />
        {/* Share and invite links opened inside the app land on the map. */}
        <Route path="/f/*" element={<Navigate to="/" replace />} />
        <Route path="/i/*" element={<Navigate to="/" replace />} />
        <Route path="/room/:ident" element={<RoomDetailScreen />} />
        <Route path="/t/:link" element={<TableScreen />} />
        <Route path="/g/:link" element={<GatheringScreen />} />
        <Route path="/o/:slug" element={<OrganizationScreen />} />
        {FocusGallery && (
          <Route
            path="/dev/focus"
            element={
              <Suspense fallback={null}>
                <FocusGallery />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<CampusScreen />} />
      </Routes>
      </ErrorBoundary>
      <FocusNotifications />
      <LectureGuard />
      <AppUpdates />
      <TableReminder />
      {focus.active && checkIn && (
        <CheckInSheet
          // On the session's own room the focus surface asks instead.
          open={checkIn.phase === 'confirm' && location.pathname !== `/room/${encodeURIComponent(focus.active.roomIdent)}`}
          variant={wide ? 'dialog' : 'sheet'}
          title={
            checkIn.blockLabel
              ? t(`Break's over in ${focus.active.roomCode}`, `Pause vorbei in ${focus.active.roomCode}`)
              : t(`Still focusing in ${focus.active.roomCode}?`, `Lernst du noch in ${focus.active.roomCode}?`)
          }
          meta={`${checkIn.blockLabel ?? checkIn.clock} · ${focus.active.roomCode}`}
          body={checkIn.line}
          endLabel={t('End', 'Beenden')}
          keepLabel={checkIn.confirmLabel}
          onKeep={() => void focus.confirm()}
          onEnd={() => void focus.end()}
        />
      )}
    </main>
  );

  if (!wide) {
    // Content scrolls; bottom navigation bar pinned below.
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        {content}
        {nav}
      </div>
    );
  }
  // Rail / drawer pinned left; content scrolls beside it.
  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      {nav}
      {content}
    </div>
  );
}
