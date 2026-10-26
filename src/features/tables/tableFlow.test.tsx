import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import type { Identity, IdentityApi } from '../../data/identityApi';
import type { TablesApi } from '../../data/tablesApi';
import { StudyProfileProvider } from '../profile/StudyProfileContext';
import { TablesProvider } from './TablesContext';
import { useTableFlow } from './useTableFlow';

const ROOM = { ident: 'r1', code: 'C211' } as Parameters<typeof useTableFlow>[0];

function identityApi(signedIn: boolean): IdentityApi {
  const identity: Identity = {
    displayName: 'Lena', programmeId: 'ain-b', intakeYear: 2023, intakeTerm: 'winter',
    defaultVisibility: 'private', showName: false, version: 1,
  };
  return {
    currentEmail: async () => (signedIn ? 'lena@example.test' : null),
    onAuthChange: () => () => {},
    sendCode: async () => {},
    verifyCode: async () => {},
    signOut: async () => {},
    programmes: async () => [],
    getIdentity: async () => (signedIn ? identity : null),
    saveIdentity: async () => identity,
    deleteIdentity: async () => {},
  };
}
const tablesApi = { mine: async () => [] } as unknown as TablesApi;

function Probe() {
  return <p>{useTableFlow(ROOM).available ? 'offered' : 'hidden'}</p>;
}

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
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function flow(signedIn: boolean) {
  await act(async () =>
    root.render(
      <MemoryRouter>
        <I18nProvider>
          <StudyProfileProvider api={identityApi(signedIn)}>
            <TablesProvider api={tablesApi}>
              <Probe />
            </TablesProvider>
          </StudyProfileProvider>
        </I18nProvider>
      </MemoryRouter>,
    ),
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return container.textContent;
}

describe('Study together on a room', () => {
  it('is not offered while signed out', async () => {
    expect(await flow(false)).toBe('hidden');
  });

  it('is offered once you have a study profile', async () => {
    expect(await flow(true)).toBe('offered');
  });
});
