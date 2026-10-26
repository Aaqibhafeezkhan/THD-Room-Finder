import type { NotificationStage } from '../../data/focusNotifier';
import { formatTime } from '../../domain/format';
import { CONFIRM_GRACE_MINUTES, isOpen, statusAt } from '../../domain/focusRhythm';
import { REMINDER_MINUTES } from '../../domain/focusSounds';
import type { SoundEvent } from '../../domain/focusSounds';
import type { Phase, SessionPlan } from '../../domain/focusRhythm';
import type { Translate } from '../../i18n';
import { isHome } from './FocusSessionContext';
import type { ActiveSession } from './FocusSessionContext';
import { isPlayable } from './soundPreference';
import type { SoundSet } from './soundPreference';

/**
 * What the notification says from now until the next answer the session
 * needs (ADR 0004 §7): the running block or break with a countdown, the
 * break that follows, "Break's over" with Start Block N, and its removal
 * when nobody answered. A plan that runs out ends with a short note. Room
 * code (or "At home") and phase only, never a name or batch: it shows on
 * the lock screen. A home session opens the Focus tab. "Break's over" alerts
 * again, once, five minutes later; each alert names its sound (ADR 0012).
 */
export function notificationStages(
  s: ActiveSession,
  plan: SessionPlan,
  now: Date,
  t: Translate,
  set: SoundSet = 'phone',
): NotificationStage[] {
  const status = statusAt(plan, s.confirmed, now);
  if (status.kind === 'done') return [];
  const home = isHome(s);
  const room = home ? t('At home', 'Zu Hause') : s.roomCode;
  const url = home ? '/focus' : `/room/${encodeURIComponent(s.roomIdent)}`;
  const open = isOpen(s.rhythm);
  const endLabel = t('End', 'Beenden');
  const nowMs = now.getTime();
  const base = { url, endLabel, ongoing: true };
  const chosen: SoundSet = s.muted ? 'silent' : set;
  const sound = (event: SoundEvent) =>
    isPlayable(chosen) ? { sound: `${chosen}_${event}` } : chosen === 'silent' ? { sound: 'silent' } : {};

  const confirmStage = (p: Phase, at: number, alert: boolean): NotificationStage[] => {
    const deadline = Math.min(p.start.getTime() + CONFIRM_GRACE_MINUTES * 60000, p.end.getTime());
    const ask = {
      ...base,
      title: open ? t(`Still focusing? · ${room}`, `Lernst du noch? · ${room}`) : t(`Break's over · ${room}`, `Pause vorbei · ${room}`),
      text: open
        ? t(`Keep going by ${formatTime(new Date(deadline))}, or the session ends.`, `Weiter bis ${formatTime(new Date(deadline))}, sonst endet die Session.`)
        : t(
            `Start block ${p.block} by ${formatTime(new Date(deadline))}, or the session ends.`,
            `Starte Block ${p.block} bis ${formatTime(new Date(deadline))}, sonst endet die Session.`,
          ),
      countdownTo: deadline,
      confirmLabel: open ? t('Keep Going', 'Weiter lernen') : t(`Start Block ${p.block}`, `Block ${p.block} starten`),
      ...sound('back'),
    };
    const remind = p.start.getTime() + REMINDER_MINUTES * 60000;
    return [
      { ...ask, at, alert },
      ...(remind > at && remind < deadline ? [{ ...ask, at: remind, alert: true }] : []),
      { ...base, at: deadline, alert: false, title: '', text: '', clear: true },
    ];
  };

  if (status.kind === 'confirm') return confirmStage(status.phase, nowMs, false);

  const stages: NotificationStage[] = [];
  const from = plan.phases.indexOf(status.phase);
  for (let i = from; i < plan.phases.length; i++) {
    const p = plan.phases[i];
    const at = i === from ? nowMs : p.start.getTime();
    const alert = i !== from;
    if (p.kind === 'focus' && p.block > s.confirmed) return [...stages, ...confirmStage(p, at, alert)];
    if (p.kind === 'focus') {
      const next = plan.phases[i + 1];
      stages.push({
        ...base,
        at,
        alert,
        title: t(`Focus · ${room}`, `Fokus · ${room}`),
        text: open
          ? t(`Ends ${formatTime(plan.end)}`, `Endet ${formatTime(plan.end)}`)
          : next
            ? t(
                `Block ${p.block} of ${plan.blocks} · break at ${formatTime(p.end)}`,
                `Block ${p.block} von ${plan.blocks} · Pause um ${formatTime(p.end)}`,
              )
            : t(`Last block · ends ${formatTime(p.end)}`, `Letzter Block · endet ${formatTime(p.end)}`),
        ...(open ? { countUpFrom: new Date(s.startedAt).getTime() } : { countdownTo: p.end.getTime() }),
      });
    } else {
      stages.push({
        ...base,
        at,
        alert,
        ...sound('break'),
        title: t(`Break · ${room}`, `Pause · ${room}`),
        text: t(`Block ${p.block + 1} at ${formatTime(p.end)}`, `Block ${p.block + 1} um ${formatTime(p.end)}`),
        countdownTo: p.end.getTime(),
      });
    }
  }
  stages.push({
    url,
    at: plan.end.getTime(),
    alert: true,
    ongoing: false,
    ...sound('done'),
    title: t(`Session done · ${room}`, `Session beendet · ${room}`),
    text: t('Your focus time is in your focus graph.', 'Deine Fokuszeit steht in deinem Fokus-Verlauf.'),
  });
  return stages;
}
