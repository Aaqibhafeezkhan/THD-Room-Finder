import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/**
 * A screen that throws while rendering shows a way out instead of a blank
 * page. Around the routes (`inShell`) the navigation stays and moving to
 * another screen clears the error; at the root it is the last resort and
 * offers a reload. A script file that can't load (offline before it was
 * cached, or replaced by a newer version) asks for a reload, which fixes it.
 *
 * It sits outside the language provider at the root, so it reads the stored
 * language itself.
 */
interface Props {
  children: ReactNode;
  /** Changes when the screen changes, to give the new screen a fresh try. */
  resetKey?: string;
  inShell?: boolean;
}

interface State {
  error: Error | null;
}

const words = () => {
  let de = false;
  try {
    de = (localStorage.getItem('thd_locale') ?? navigator.language).startsWith('de');
  } catch {
    de = navigator.language.startsWith('de');
  }
  return de
    ? {
        title: 'Hier ist etwas schiefgelaufen',
        hint: 'Deine gespeicherten Räume und dein Fokus-Verlauf sind sicher.',
        update: 'Eine neue Version ist da, oder du bist offline. Neu laden behebt das meist.',
        reload: 'Neu laden',
        home: 'Zum Campus',
      }
    : {
        title: 'Something went wrong here',
        hint: 'Your saved rooms and focus history are safe.',
        update: "There's a new version, or you're offline. Reloading usually fixes this.",
        reload: 'Reload',
        home: 'Go to Campus',
      };
};

export const isChunkError = (error: Error) =>
  /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(`${error.name} ${error.message}`);

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen error', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const w = words();
    const button = {
      minHeight: 48,
      padding: '0 24px',
      borderRadius: 'var(--radius-full, 999px)',
      border: 'none',
      font: 'inherit',
      fontWeight: 500,
      cursor: 'pointer',
    } as const;
    return (
      <div
        role="alert"
        style={{
          minHeight: this.props.inShell ? undefined : '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 'var(--space-10, 48px) var(--space-4, 16px)',
          textAlign: 'center',
          background: 'var(--md-background, #fff)',
          color: 'var(--md-on-surface, #1C1B1F)',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 'var(--title-large-size, 22px)', fontWeight: 500 }}>{w.title}</h1>
        <p style={{ margin: 0, maxWidth: 420, color: 'var(--md-on-surface-variant, #44464F)' }}>
          {isChunkError(error) ? w.update : w.hint}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" onClick={() => location.reload()} style={{ ...button, background: 'var(--md-primary, #1565C0)', color: 'var(--md-on-primary, #fff)' }}>
            {w.reload}
          </button>
          {this.props.inShell && (
            <button type="button" onClick={() => location.assign('/')} style={{ ...button, background: 'transparent', color: 'var(--md-primary, #1565C0)' }}>
              {w.home}
            </button>
          )}
        </div>
      </div>
    );
  }
}
