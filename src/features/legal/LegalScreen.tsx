import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../../components';
import { focusServiceConfigured } from '../../data/supabaseClient';
import { useI18n } from '../../i18n';
import { Page } from '../shared/ui';
import { OPERATOR } from './operator';
import type { Operator } from './operator';

/**
 * About, privacy and imprint on one page behind Settings (#248).
 *
 * Every sentence in the privacy part describes something the code does:
 * - device storage: data/cache.ts, features/favorites, focusHistoryStore
 * - the timetable proxy: api/ on Vercel (web); Android asks THabella itself
 * - visit counting: lib/analytics.ts (paths only, invite links replaced)
 * - the focus service: supabase/migrations (identity, session, history,
 *   saved rooms, study tables, gatherings); sign-in by email code
 * - deletion: Settings, Delete Profile
 * Change the text when one of those changes.
 */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  // Plain text on the page, like a document: no card, no shadow. The gap
  // between sections does the separating.
  return (
    <section id={id} aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--title-medium-size)', fontWeight: 500, color: 'var(--md-on-surface)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: 'var(--body-medium-size)', lineHeight: 1.6, color: 'var(--md-on-surface-variant)', overflowWrap: 'anywhere' }}>
      {children}
    </p>
  );
}

function Topic({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h3 style={{ margin: 0, fontSize: 'var(--body-medium-size)', fontWeight: 500, color: 'var(--md-on-surface)' }}>
        {title}
      </h3>
      <P>{children}</P>
    </div>
  );
}

const link = { color: 'var(--md-primary)' } as const;

export function LegalScreen({ operator = OPERATOR, signIn = focusServiceConfigured }: {
  operator?: Operator;
  /** Whether this build can sign in to the focus service at all. */
  signIn?: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <>
      <AppBar
        mode="back" backLabel={t('Back', 'Zurück')}
        title={t('About and privacy', 'Über die App und Datenschutz')}
        onBack={() => navigate('/profile/settings')}
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      />
      <Page style={{ gap: 'var(--space-8)', paddingBottom: 'var(--space-10)' }}>
        <Section id="about" title={t('Not an official THD app', 'Keine offizielle App der THD')}>
          <P>
            {t(
              'THD Room Finder is a student project. It is not operated, commissioned or checked by Deggendorf Institute of Technology (THD), and THD is not responsible for what it shows.',
              'THD Room Finder ist ein studentisches Projekt. Die App wird nicht von der Technischen Hochschule Deggendorf (THD) betrieben, beauftragt oder geprüft, und die THD ist für ihre Angaben nicht verantwortlich.',
            )}
          </P>
          <P>
            {t(
              'Rooms and times come from THabella, THD\'s scheduling system, through the open interface its public timetable pages use. They can be wrong or out of date: a free room here is not a booking and gives no right to the room.',
              'Räume und Zeiten kommen aus THabella, dem Planungssystem der THD, über die offene Schnittstelle, die auch dessen öffentliche Stundenplanseiten nutzen. Sie können falsch oder veraltet sein: Ein hier freier Raum ist keine Buchung und gibt kein Anrecht auf den Raum.',
            )}
          </P>
          <P>
            {t('The code is open source under GPL-3.0: ', 'Der Code ist Open Source unter GPL-3.0: ')}
            <a href={operator.repository} target="_blank" rel="noreferrer" style={link}>
              {operator.repository.replace('https://', '')}
            </a>
          </P>
        </Section>

        <Section id="contact" title={t('Help, ideas, contributing', 'Hilfe, Ideen, Mitmachen')}>
          <P>
            {t(
              'For support, a question or a suggestion, or if you would like to help build the app, reach Alex on GitHub: ',
              'Für Hilfe, eine Frage oder einen Vorschlag, oder wenn du an der App mitbauen möchtest, schreib Alex auf GitHub: ',
            )}
            <a href={operator.github} target="_blank" rel="noreferrer" style={link}>
              {operator.github.replace('https://', '')}
            </a>
          </P>
          <P>
            {t('Bugs and ideas can also go straight to the project: ', 'Fehler und Ideen kannst du auch direkt beim Projekt melden: ')}
            <a href={`${operator.repository}/issues`} target="_blank" rel="noreferrer" style={link}>
              {t('open an issue', 'ein Issue öffnen')}
            </a>
            {t('. How to contribute is in CONTRIBUTING.md there.', '. Wie man mitmacht, steht dort in CONTRIBUTING.md.')}
          </P>
        </Section>

        <Section id="privacy" title={t('Privacy', 'Datenschutz')}>
          <Topic title={t('Without signing in', 'Ohne Anmeldung')}>
            {t(
              'Finding rooms and the focus timer work without an account. Saved rooms, settings and your focus history are kept in this browser or on this phone and are not sent anywhere.',
              'Räume finden und der Fokus-Timer funktionieren ohne Konto. Gemerkte Räume, Einstellungen und dein Fokus-Verlauf bleiben in diesem Browser oder auf diesem Handy und werden nirgendwohin gesendet.',
            )}
          </Topic>
          <Topic title={t('Loading the timetable', 'Stundenplan laden')}>
            {t(
              'In the browser, timetable requests go through a small relay hosted at Vercel, which passes them on to THabella. Like any web server, the host sees your IP address while it answers. The Android app asks THabella directly.',
              'Im Browser laufen Stundenplan-Anfragen über eine kleine Weiterleitung bei Vercel, die sie an THabella weitergibt. Wie jeder Webserver sieht der Anbieter dabei deine IP-Adresse. Die Android-App fragt THabella direkt.',
            )}
          </Topic>
          <Topic title={t('Counting visits', 'Besuche zählen')}>
            {t(
              'The web app counts page views with Vercel Web Analytics, without cookies. Only the path of a page is recorded; the links of study tables and gatherings are replaced before anything is sent. The Android app does not count visits.',
              'Die Web-App zählt Seitenaufrufe mit Vercel Web Analytics, ohne Cookies. Erfasst wird nur der Pfad einer Seite; die Links von Lerntischen und Treffen werden vor dem Senden ersetzt. Die Android-App zählt keine Besuche.',
            )}
          </Topic>
          {signIn && (
            <>
              <Topic title={t('When you sign in', 'Wenn du dich anmeldest')}>
                {t(
                  'Signing in is optional and uses a code sent to your email address. The focus service, hosted at Supabase, then stores: your email address for signing in; your study profile (programme, intake year and term, and a display name if you set one); your focus sessions (room, start and end, and whether they are private or visible to your batch); the dates and minutes of your focus history, so the graph matches across your devices; your saved rooms, so they follow you too; and the study tables and gatherings you create or answer.',
                  'Die Anmeldung ist freiwillig und nutzt einen Code, der an deine E-Mail-Adresse geht. Der Fokus-Dienst, betrieben bei Supabase, speichert dann: deine E-Mail-Adresse für die Anmeldung; dein Studienprofil (Studiengang, Startjahr und -semester und einen Anzeigenamen, falls du einen setzt); deine Fokus-Sitzungen (Raum, Beginn und Ende und ob sie privat oder für deinen Jahrgang sichtbar sind); Datum und Minuten deines Fokus-Verlaufs, damit er auf deinen Geräten gleich ist; deine gemerkten Räume, damit sie mitkommen; und die Lerntische und Treffen, die du anlegst oder beantwortest.',
                )}
              </Topic>
              <Topic title={t('What others see', 'Was andere sehen')}>
                {t(
                  'A private session shows others only that someone is focusing in the room. A public session shows your batch to people in the same batch, and your name only if you switched that on. Anyone with the link to a study table sees the room, the time, the topic and the first names of those who answered.',
                  'Eine private Sitzung zeigt anderen nur, dass jemand im Raum lernt. Eine öffentliche Sitzung zeigt Leuten aus demselben Jahrgang deinen Jahrgang, und deinen Namen nur, wenn du das eingeschaltet hast. Wer den Link zu einem Lerntisch hat, sieht Raum, Zeit, Thema und die Vornamen derer, die geantwortet haben.',
                )}
              </Topic>
              <Topic title={t('Deleting your data', 'Deine Daten löschen')}>
                {t(
                  'Settings, Delete Profile ends your sessions and removes your study profile and the synced history from the focus service. Clear history removes the history on this device and, when signed in, the synced copy. Data kept only on the device goes when you clear the site data or uninstall the app.',
                  'Einstellungen, Profil löschen beendet deine Sitzungen und entfernt dein Studienprofil und den synchronisierten Verlauf aus dem Fokus-Dienst. Verlauf löschen entfernt den Verlauf auf diesem Gerät und, wenn du angemeldet bist, die synchronisierte Kopie. Was nur auf dem Gerät liegt, verschwindet, wenn du die Website-Daten löschst oder die App deinstallierst.',
                )}
              </Topic>
            </>
          )}
          <Topic title={t('Not collected', 'Nicht erhoben')}>
            {t(
              'The app never reads your location, and it shows no advertising and sells no data.',
              'Die App liest nie deinen Standort, zeigt keine Werbung und verkauft keine Daten.',
            )}
          </Topic>
          <Topic title={t('Questions and requests', 'Fragen und Anfragen')}>
            {t(
              'To ask what is stored about you, or to have it corrected or deleted, write to the operator named below.',
              'Wenn du wissen willst, was über dich gespeichert ist, oder es berichtigen oder löschen lassen möchtest, schreib dem unten genannten Betreiber.',
            )}
          </Topic>
        </Section>

        <Section id="imprint" title={t('Imprint', 'Impressum')}>
          <P>
            {t('Responsible for this app: ', 'Verantwortlich für diese App: ')}
            <strong style={{ color: 'var(--md-on-surface)', fontWeight: 500 }}>{operator.name}</strong>
            {t(', student at THD.', ', Student an der THD.')}
          </P>
          {operator.address ? (
            <P>
              {operator.address.map((line) => (
                <span key={line} style={{ display: 'block' }}>{line}</span>
              ))}
            </P>
          ) : (
            <P>{t('A postal address will be added here.', 'Eine Postanschrift wird hier ergänzt.')}</P>
          )}
          <P>
            {t('Contact: ', 'Kontakt: ')}
            {operator.email ? (
              <a href={`mailto:${operator.email}`} style={link}>{operator.email}</a>
            ) : (
              <a href={`${operator.repository}/issues`} target="_blank" rel="noreferrer" style={link}>
                {t('open an issue on GitHub', 'ein Issue auf GitHub öffnen')}
              </a>
            )}
          </P>
          <P>
            {`© ${operator.since} ${operator.name}. `}
            {t(
              'Released under GPL-3.0: you may use, copy and change the app, but every copy has to keep this notice, name its changes and stay under the same licence with its source open.',
              'Veröffentlicht unter GPL-3.0: Du darfst die App nutzen, kopieren und ändern, aber jede Kopie muss diesen Hinweis behalten, ihre Änderungen nennen und mit offenem Quelltext unter derselben Lizenz bleiben.',
            )}
          </P>
        </Section>
      </Page>
    </>
  );
}
