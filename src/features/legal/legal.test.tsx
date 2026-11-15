import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import { LegalScreen } from './LegalScreen';
import type { Operator } from './operator';

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
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function render(node: ReactNode) {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <I18nProvider>{node}</I18nProvider>
      </MemoryRouter>,
    );
  });
}

const someone: Operator = {
  name: 'Erika Mustermann',
  address: ['Beispielweg 1', '94469 Deggendorf'],
  email: 'erika@example.org',
  repository: 'https://example.org/repo',
};

describe('about, privacy and imprint', () => {
  it('says the app is a student project and not an official THD app', async () => {
    await render(<LegalScreen />);
    expect(container.textContent).toContain('Not an official THD app');
    expect(container.textContent).toContain('It is not operated, commissioned or checked by');
  });

  it('describes sign-in data only in a build that can sign in', async () => {
    await render(<LegalScreen signIn={false} />);
    expect(container.textContent).not.toContain('When you sign in');
    await render(<LegalScreen signIn />);
    expect(container.textContent).toContain('When you sign in');
    expect(container.textContent).toContain('Deleting your data');
  });

  it("shows the operator's address and email in the imprint when they are set", async () => {
    await render(<LegalScreen operator={someone} />);
    expect(container.textContent).toContain('Erika Mustermann');
    expect(container.textContent).toContain('94469 Deggendorf');
    expect(container.querySelector('a[href="mailto:erika@example.org"]')).not.toBeNull();
  });

  it('says the postal address is still to come when none is set', async () => {
    await render(<LegalScreen operator={{ ...someone, address: null, email: null }} />);
    expect(container.textContent).toContain('A postal address will be added here.');
    expect(container.querySelector('a[href="https://example.org/repo/issues"]')).not.toBeNull();
  });

  it('reads in German when the language is German', async () => {
    localStorage.setItem('thd_locale', 'de');
    await render(<LegalScreen />);
    expect(container.textContent).toContain('Keine offizielle App der THD');
    expect(container.textContent).toContain('Impressum');
  });
});
