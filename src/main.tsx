import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Analytics } from '@vercel/analytics/react';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { beforeSend } from './lib/analytics';
import { ErrorBoundary } from './app/ErrorBoundary';
import './styles/index.css';

const shouldEnableVercelAnalytics = !Capacitor.isNativePlatform();

// The service worker keeps the web app current and offline-ready. The Android
// app ships its files and updates itself (#113); a worker left over from an
// earlier version would keep serving the old files, so it is removed there.
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true });
} else if ('serviceWorker' in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((all) => Promise.all(all.map((r) => r.unregister())))
    .catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        {shouldEnableVercelAnalytics ? <Analytics beforeSend={beforeSend} /> : null}
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
