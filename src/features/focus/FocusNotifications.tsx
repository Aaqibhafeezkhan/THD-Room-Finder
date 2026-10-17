import { useEffect, useRef } from 'react';
import { focusNotifier } from '../../data/focusNotifier';
import type { FocusNotifier } from '../../data/focusNotifier';
import { useI18n } from '../../i18n';
import { useFocusSession } from './FocusSessionContext';
import { notificationStages } from './notificationStages';

/**
 * Keeps the running-session notification in step with the session (ADR 0004
 * §7): rescheduled whenever the phase changes or a block is confirmed,
 * cleared when the session ends or runs on another device. Its "Start Block N" and "End" actions come
 * back here, and on Android the time spent in other apps is collected each
 * time the app returns. Renders nothing.
 */
export function FocusNotifications({ notifier = focusNotifier() }: { notifier?: FocusNotifier }) {
  const focus = useFocusSession();
  const { t } = useI18n();
  const latest = useRef(focus);
  latest.current = focus;

  const { active, plan, status } = focus;
  // A session picked up from another device rings there, not here, until a
  // block is confirmed on this one (ADR 0005).
  const phaseKey =
    active && !active.adopted && status && status.kind !== 'done'
      ? `${active.startedAt}|${active.confirmed}|${active.roomIdent}|${status.kind}|${'phase' in status ? status.phase.block : ''}`
      : '';

  useEffect(() => {
    const { active: s, plan: p } = latest.current;
    if (!phaseKey || !s || !p) {
      void notifier.clear().catch(() => undefined);
      return;
    }
    void notifier.schedule(notificationStages(s, p, new Date(), t)).catch(() => undefined);
  }, [phaseKey, plan, notifier, t]);

  useEffect(
    () =>
      notifier.onAction((a) => {
        if (a === 'confirm') void latest.current.confirm();
        else void latest.current.end();
      }),
    [notifier],
  );

  useEffect(() => {
    if (notifier.kind !== 'android') return;
    const collect = async () => {
      if (document.visibilityState !== 'visible') return;
      const spans = await notifier.takeAway().catch(() => []);
      if (spans.length && latest.current.active) latest.current.addAway(spans);
    };
    document.addEventListener('visibilitychange', collect);
    return () => document.removeEventListener('visibilitychange', collect);
  }, [notifier]);

  return null;
}
