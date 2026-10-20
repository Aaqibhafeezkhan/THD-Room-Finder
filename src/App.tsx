import { ThemeProvider } from './lib/theme';
import { MapPrefsProvider } from './lib/mapPrefs';
import { I18nProvider } from './i18n';
import { RoomDataProvider } from './features/rooms/RoomDataContext';
import { RoomFilterProvider } from './features/rooms/RoomFilterContext';
import { FavoritesProvider } from './features/favorites/favorites';
import { FocusHistoryProvider } from './features/focus/FocusHistoryContext';
import { StudyProfileProvider } from './features/profile/StudyProfileContext';
import { TablesProvider } from './features/tables/TablesContext';
import { FocusSessionProvider } from './features/focus/FocusSessionContext';
import { AppShell } from './app/AppShell';

/**
 * App root — providers wrap the shell:
 *   ThemeProvider  → device-adaptive light/dark
 *   I18nProvider   → EN/DE
 *   RoomDataProvider → THabella data, teaching filter, time-travel, auto-refresh
 *   FavoritesProvider → saved rooms
 *   StudyProfileProvider → sign-in and study profile (focus service)
 *   TablesProvider       → study tables and the student's own
 *   FocusHistoryProvider → focus history on the device, synced when signed in
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
                <StudyProfileProvider>
                  <TablesProvider>
                  <FocusHistoryProvider>
                    <FocusSessionProvider>
                      <AppShell />
                    </FocusSessionProvider>
                  </FocusHistoryProvider>
                  </TablesProvider>
                </StudyProfileProvider>
              </FavoritesProvider>
            </RoomFilterProvider>
          </RoomDataProvider>
        </I18nProvider>
      </MapPrefsProvider>
    </ThemeProvider>
  );
}
