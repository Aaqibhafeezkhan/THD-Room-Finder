import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type { AwaySpan } from '../domain/focusRhythm';

/**
 * The running-session notification (ADR 0004 §7), one adapter per platform.
 *
 *   • Android: a native plugin (android/…/focus) posts an ongoing
 *     notification whose countdown the system draws, on the lock screen
 *     too, and arms an alarm for each next stage, so it moves on with the
 *     app closed. Its actions open the app with "confirm" or "end". It also
 *     reports time spent in other apps with the screen on.
 *   • Web: a notification while the page is hidden, with fixed text. Later
 *     stages only appear while the browser keeps the page alive.
 *
 * The app hands over the stages up to the next answer it needs; each stage
 * is shown from `at` until the next one.
 */
export interface NotificationStage {
  /** When this stage starts (epoch ms). */
  at: number;
  title: string;
  text: string;
  /** System countdown to this time (Android). */
  countdownTo?: number;
  /** System stopwatch from this time (Android, Open rhythm). */
  countUpFrom?: number;
  /** "Start Block 3": an action that opens the app and confirms. */
  confirmLabel?: string;
  /** "End": an action that opens the app and ends the session. */
  endLabel?: string;
  /** Vibrate and sound when the stage begins. */
  alert: boolean;
  /** False for a final note that can be swiped away. */
  ongoing: boolean;
  /** Remove the notification instead. */
  clear?: boolean;
  /** Where tapping it leads, e.g. "/room/r000000139". */
  url: string;
}

export type NotifyPermission = 'granted' | 'denied' | 'prompt';
export type NotifyAction = 'confirm' | 'end';

export interface FocusNotifier {
  kind: 'android' | 'web' | 'none';
  permission(): Promise<NotifyPermission>;
  request(): Promise<NotifyPermission>;
  /** Replace whatever is shown or scheduled with these stages. */
  schedule(stages: NotificationStage[]): Promise<void>;
  clear(): Promise<void>;
  onAction(cb: (a: NotifyAction) => void): () => void;
  /** Time spent in other apps since the last call (Android only). */
  takeAway(): Promise<AwaySpan[]>;
  /** Android 12+: whether alarms may fire on the minute. */
  exactAlarms(): Promise<boolean>;
  openExactAlarmSettings(): Promise<void>;
}

interface NativePlugin {
  checkPermissions(): Promise<{ notifications: string }>;
  requestPermissions(): Promise<{ notifications: string }>;
  schedule(o: { stages: NotificationStage[] }): Promise<void>;
  clear(): Promise<void>;
  takeAway(): Promise<{ spans: AwaySpan[] }>;
  exactAlarms(): Promise<{ allowed: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  addListener(event: 'action', cb: (d: { action: string }) => void): Promise<PluginListenerHandle>;
}

const asPermission = (s: string | undefined): NotifyPermission =>
  s === 'granted' ? 'granted' : s === 'denied' ? 'denied' : 'prompt';

function androidNotifier(): FocusNotifier {
  const plugin = registerPlugin<NativePlugin>('FocusNotification');
  return {
    kind: 'android',
    permission: async () => asPermission((await plugin.checkPermissions()).notifications),
    request: async () => asPermission((await plugin.requestPermissions()).notifications),
    schedule: (stages) => plugin.schedule({ stages }),
    clear: () => plugin.clear(),
    onAction(cb) {
      const handle = plugin.addListener('action', (d) => {
        if (d.action === 'confirm' || d.action === 'end') cb(d.action);
      });
      return () => void handle.then((h) => h.remove());
    },
    takeAway: async () => (await plugin.takeAway()).spans,
    exactAlarms: async () => (await plugin.exactAlarms()).allowed,
    openExactAlarmSettings: () => plugin.openExactAlarmSettings(),
  };
}

const TAG = 'thd-focus';

function webNotifier(): FocusNotifier {
  let stages: NotificationStage[] = [];
  let timers: number[] = [];

  const registration = async () =>
    'serviceWorker' in navigator ? ((await navigator.serviceWorker.getRegistration()) ?? null) : null;

  const close = async () => {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
    const reg = await registration();
    if (reg) (await reg.getNotifications({ tag: TAG })).forEach((n) => n.close());
  };

  const show = async (s: NotificationStage, alert: boolean) => {
    if (Notification.permission !== 'granted') return;
    if (s.clear) {
      await close();
      return;
    }
    const options = {
      body: s.text,
      tag: TAG,
      icon: '/icons/app-icon-192.png',
      silent: !alert,
      renotify: alert,
      requireInteraction: s.ongoing,
      data: { url: s.url },
    } as NotificationOptions;
    const reg = await registration();
    if (reg) await reg.showNotification(s.title, options);
    else new Notification(s.title, options).onclick = () => window.focus();
  };

  // Shown only while the page is hidden; coming back clears it.
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      void close();
      return;
    }
    const now = Date.now();
    const current = [...stages].reverse().find((s) => s.at <= now);
    if (current) void show(current, false);
    for (const s of stages.filter((x) => x.at > now)) {
      timers.push(window.setTimeout(() => void show(s, s.alert), s.at - now));
    }
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);

  return {
    kind: 'web',
    permission: async () => asPermission(Notification.permission === 'default' ? 'prompt' : Notification.permission),
    request: async () => asPermission(await Notification.requestPermission()),
    async schedule(next) {
      stages = next;
      if (document.visibilityState === 'hidden') {
        await close();
        onVisibility();
      }
    },
    async clear() {
      stages = [];
      await close();
    },
    onAction: () => () => {},
    takeAway: async () => [],
    exactAlarms: async () => true,
    openExactAlarmSettings: async () => {},
  };
}

function noNotifier(): FocusNotifier {
  return {
    kind: 'none',
    permission: async () => 'denied',
    request: async () => 'denied',
    schedule: async () => {},
    clear: async () => {},
    onAction: () => () => {},
    takeAway: async () => [],
    exactAlarms: async () => true,
    openExactAlarmSettings: async () => {},
  };
}

let instance: FocusNotifier | null = null;

export function focusNotifier(): FocusNotifier {
  instance ??=
    Capacitor.getPlatform() === 'android'
      ? androidNotifier()
      : typeof window !== 'undefined' && 'Notification' in window
        ? webNotifier()
        : noNotifier();
  return instance;
}
