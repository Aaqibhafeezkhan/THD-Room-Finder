import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../lib/theme';
import { MapPrefsProvider } from '../../lib/mapPrefs';
import { I18nProvider } from '../../i18n';
import { memoryStore } from '../../data/focusHistoryStore';
import type { FocusHistoryStore } from '../../data/focusHistoryStore';
import { exportHistory } from '../../domain/focusHistory';
import { FocusHistoryProvider } from '../focus/FocusHistoryContext';
import { ServiceError } from '../../data/identityApi';
import type { Identity, IdentityApi, IdentityInput } from '../../data/identityApi';
import { SettingsScreen } from './SettingsScreen';
import { StudyProfileProvider } from './StudyProfileContext';

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('thd_locale', 'en');
  document.documentElement.removeAttribute('data-accent');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

/** In-memory focus service: accepts the code 123456 for any address. */
function fakeIdentityApi(): IdentityApi & { saved: IdentityInput[]; deleted: boolean } {
  let email: string | null = null;
  let identity: Identity | null = null;
  const listeners = new Set<(e: string | null) => void>();
  const api = {
    saved: [] as IdentityInput[],
    deleted: false,
    async currentEmail() {
      return email;
    },
    onAuthChange(cb: (e: string | null) => void) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    async sendCode() {},
    async verifyCode(mail: string, code: string) {
      if (code !== '123456') throw new ServiceError('code_expired');
      email = mail;
    },
    async signOut() {
      email = null;
      listeners.forEach((l) => l(null));
    },
    async programmes() {
      return [
        { id: 'ain-b', code: 'AIN', nameEn: 'Artificial Intelligence', nameDe: 'Artificial Intelligence', intakeTerms: ['winter' as const], level: 'bachelor' as const, campus: ['Deggendorf'] },
        { id: 'ki-b', code: 'KI', nameEn: 'Artificial Intelligence', nameDe: 'Künstliche Intelligenz', intakeTerms: ['winter' as const], level: 'bachelor' as const, campus: ['Deggendorf'] },
        { id: 'ki-m', code: 'KI', nameEn: 'Artificial Intelligence for Smart Sensors and Actuators', nameDe: 'Artificial Intelligence for Smart Sensors and Actuators', intakeTerms: ['winter' as const], level: 'master' as const, campus: ['Deggendorf'] },
      ];
    },
    async getIdentity() {
      return identity;
    },
    async saveIdentity(input: IdentityInput, expected: number | null) {
      if (expected !== (identity?.version ?? null)) throw new ServiceError('stale_version');
      api.saved.push(input);
      identity = { ...input, version: (identity?.version ?? 0) + 1 };
      return identity;
    },
    async deleteIdentity() {
      api.deleted = true;
      identity = null;
    },
  };
  return api;
}

function Providers({ children, path, store = memoryStore(), api = null }: {
  children: ReactNode;
  path: string;
  store?: FocusHistoryStore;
  api?: IdentityApi | null;
}) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <MapPrefsProvider>
          <I18nProvider>
            <FocusHistoryProvider store={store}>
              <StudyProfileProvider api={api}>{children}</StudyProfileProvider>
            </FocusHistoryProvider>
          </I18nProvider>
        </MapPrefsProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

function button(name: string): HTMLButtonElement {
  const el = [...container.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === name);
  if (!el) throw new Error(`no button ${name}`);
  return el;
}

const session = {
  id: 's1',
  startedAt: '2026-10-13T08:00:00.000Z',
  endedAt: '2026-10-13T09:25:00.000Z',
  minutes: 85,
  room: 'E 212',
};

async function render(node: ReactNode) {
  await act(async () => root.render(node));
}

function radio(name: string): HTMLElement {
  const el = [...container.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent?.trim() === name);
  if (!el) throw new Error(`no radio ${name}`);
  return el;
}

describe('Settings', () => {
  it('sets the focus graph colour on the root element and remembers it', async () => {
    await render(
      <Providers path="/profile/settings">
        <SettingsScreen />
      </Providers>,
    );
    await act(async () => radio('Orchid').click());
    expect(document.documentElement.getAttribute('data-accent')).toBe('orchid');
    expect(localStorage.getItem('thd_accent')).toBe('orchid');

    await act(async () => radio('Violet').click());
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });

  it('restores a saved graph colour on start', async () => {
    localStorage.setItem('thd_accent', 'graphite');
    await render(
      <Providers path="/profile/settings">
        <SettingsScreen />
      </Providers>,
    );
    expect(document.documentElement.getAttribute('data-accent')).toBe('graphite');
    expect(radio('Graphite').getAttribute('aria-checked')).toBe('true');
  });

  it('switches the language from the settings list', async () => {
    await render(
      <Providers path="/profile/settings">
        <SettingsScreen />
      </Providers>,
    );
    await act(async () => radio('Deutsch').click());
    expect(container.textContent).toContain('Darstellung');
  });
});

describe('Focus history settings', () => {
  it('imports an exported file into the device store', async () => {
    const store = memoryStore();
    await render(
      <Providers path="/profile/settings" store={store}>
        <SettingsScreen />
      </Providers>,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File([exportHistory([session], new Date())], 'h.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    });
    expect(await store.all()).toEqual([session]);
    expect(container.textContent).toContain('1 session imported');
  });

  it('clears the history only after confirming', async () => {
    const store = memoryStore([session]);
    await render(
      <Providers path="/profile/settings" store={store}>
        <SettingsScreen />
      </Providers>,
    );
    await act(async () => button('Clear history').click());
    expect(await store.all()).toHaveLength(1);
    await act(async () => button('Clear').click());
    expect(await store.all()).toHaveLength(0);
    expect(container.textContent).toContain('0 sessions');
  });
});

async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  });
}

async function type(label: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
  if (!input) throw new Error(`no input ${label}`);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function anyButton(name: string): HTMLButtonElement {
  const el = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === name);
  if (!el) throw new Error(`no button ${name}`);
  return el;
}

function radioStarting(text: string): HTMLElement {
  const el = [...document.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent?.startsWith(text));
  if (!el) throw new Error(`no radio ${text}`);
  return el;
}

describe('Study profile setup', () => {
  it('signs in with a code and saves programme, intake and default mode', async () => {
    const api = fakeIdentityApi();
    await render(
      <Providers path="/profile/settings" api={api}>
        <SettingsScreen />
      </Providers>,
    );
    await settle();
    await act(async () => anyButton('Set Up').click());
    await type('Email', 'lena@example.test');
    await act(async () => anyButton('Send Code').click());
    await settle();

    await type('Code', '000000');
    await act(async () => anyButton('Continue').click());
    await settle();
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('work');

    await type('Code', '123456');
    await act(async () => anyButton('Continue').click());
    await settle();
    expect(document.body.textContent).toContain('What do you study?');
    // KI exists as a bachelor and a master: the level tells them apart.
    expect(radioStarting('Artificial Intelligence for Smart Sensors and ActuatorsMaster · DeggendorfKI')).toBeTruthy();

    await act(async () => radioStarting('Artificial IntelligenceBachelor · DeggendorfAIN').click());
    await act(async () => anyButton('Next').click());
    await act(async () => radioStarting('Winter 2023').click());
    await act(async () => anyButton('Next').click());
    await act(async () => anyButton('Skip').click());
    await act(async () => radioStarting('Public').click());
    await act(async () => anyButton('Save').click());
    await settle();

    expect(api.saved).toEqual([
      {
        displayName: null,
        programmeId: 'ain-b',
        intakeYear: 2023,
        intakeTerm: 'winter',
        defaultVisibility: 'public',
        showName: false,
      },
    ]);
    expect(container.textContent).toContain('Signed in as');
    expect(container.textContent).toContain('lena@example.test');
  });

  it('signs a returning student straight in when their profile already exists', async () => {
    const api = fakeIdentityApi();
    await api.saveIdentity(
      { displayName: 'Lena', programmeId: 'ain-b', intakeYear: 2023, intakeTerm: 'winter', defaultVisibility: 'public', showName: false },
      null,
    );
    await render(
      <Providers path="/profile/settings" api={api}>
        <SettingsScreen />
      </Providers>,
    );
    await settle();
    await act(async () => anyButton('Set Up').click());
    await type('Email', 'lena@example.test');
    await act(async () => anyButton('Send Code').click());
    await settle();
    await type('Code', '123456');
    await act(async () => anyButton('Continue').click());
    await settle();

    expect(document.body.textContent).not.toContain('What do you study?');
    expect(api.saved).toHaveLength(1);
    expect(container.textContent).toContain('lena@example.test');
    expect(document.body.textContent).toContain('profile synced');
  });

  it('keeps not-listed students private and skips the intake', async () => {
    const api = fakeIdentityApi();
    await api.verifyCode('sam@example.test', '123456');
    await render(
      <Providers path="/profile/settings" api={api}>
        <SettingsScreen />
      </Providers>,
    );
    await settle();
    await act(async () => anyButton('Set Up').click());
    await act(async () => radioStarting('Other').click());
    await act(async () => anyButton('Next').click());
    expect(document.body.textContent).toContain('What should your batch call you?');
    await act(async () => anyButton('Next').click());
    expect(document.body.textContent).not.toContain('Public ·');
    await act(async () => anyButton('Save').click());
    await settle();
    expect(api.saved[0]).toMatchObject({ programmeId: null, intakeYear: null, defaultVisibility: 'private' });
  });

  it('deletes the profile only after confirming, then signs out', async () => {
    const api = fakeIdentityApi();
    await api.verifyCode('max@example.test', '123456');
    await api.saveIdentity(
      { displayName: 'Max', programmeId: 'ain-b', intakeYear: 2023, intakeTerm: 'winter', defaultVisibility: 'private', showName: false },
      null,
    );
    api.saved.length = 0;
    await render(
      <Providers path="/profile/settings" api={api}>
        <SettingsScreen />
      </Providers>,
    );
    await settle();
    await act(async () => anyButton('Delete Profile').click());
    expect(api.deleted).toBe(false);
    await act(async () => anyButton('Delete').click());
    await settle();
    expect(api.deleted).toBe(true);
    expect(await api.currentEmail()).toBeNull();
  });

  it('hides study profile settings when the focus service is not configured', async () => {
    await render(
      <Providers path="/profile/settings">
        <SettingsScreen />
      </Providers>,
    );
    expect(container.textContent).not.toContain('Study profile');
  });
});

