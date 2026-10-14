import { ThemeProvider } from './lib/theme';
import { MapPrefsProvider } from './lib/mapPrefs';
import { I18nProvider } from './i18n';
import { RoomDataProvider } from './features/rooms/RoomDataContext';
import { RoomFilterProvider } from './features/rooms/RoomFilterContext';
import { FavoritesProvider } from './features/favorites/favorites';
import { FocusHistoryProvider } from './features/focus/FocusHistoryContext';
import { StudyProfileProvider } from './features/profile/StudyProfileContext';
import { FocusSessionProvider } from './features/focus/FocusSessionContext';
import { AppShell } from './app/AppShell';

/**
 * App root — providers wrap the shell:
 *   ThemeProvider  → device-adaptive light/dark
 *   I18nProvider   → EN/DE
 *   RoomDataProvider → THabella data, teaching filter, time-travel, auto-refresh
 *   FavoritesProvider → saved rooms
 *   FocusHistoryProvider → focus history, on this device only
 *   StudyProfileProvider → sign-in and study profile (focus service)
 *   FocusSessionProvider → the running focus session and live room activity
 */
export default function App() {
  return (
    <ThemeProvider>
      <MapPrefsProvider>
        <I18nProvider>
          <RoomDataProvider>
            <RoomFilterProvider>
              <FavoritesProvider>
                <FocusHistoryProvider>
                  <StudyProfileProvider>
                    <FocusSessionProvider>
                      <AppShell />
                    </FocusSessionProvider>
                  </StudyProfileProvider>
                </FocusHistoryProvider>
              </FavoritesProvider>
            </RoomFilterProvider>
          </RoomDataProvider>
        </I18nProvider>
      </MapPrefsProvider>
    </ThemeProvider>
  );
}
