import type { FocusTrackSegment } from '../../components';
import { formatTime } from '../../domain/format';
import { RHYTHMS, isOpen } from '../../domain/focusRhythm';
import type { FocusStatus, PresetId, Rhythm, SessionPlan } from '../../domain/focusRhythm';
import { rhythmId } from '../../domain/focusRhythm';
import { formatElapsed } from '../../domain/focusSession';
import type { Translate } from '../../i18n';
import { isHome } from './FocusSessionContext';
import type { ActiveSession } from './FocusSessionContext';

/**
 * How a running session reads, wherever it is shown: the focus surface on
 * room detail, the pill in the app bar, the "break's over" sheet and the
 * notification. One place, so they always agree.
 */
export interface SessionView {
  phase: 'focus' | 'break' | 'confirm';
  /** Countdown to the end of the phase, or elapsed time in the Open rhythm. */
  clock: string;
  /** "Focus", "Break", "Break's over", "Still focusing?" */
  title: string;
  /** "Block 2 of 3"; null in the Open rhythm. */
  blockLabel: string | null;
  /** Full sentence for screen readers and the pill. */
  clockLabel: string;
  /** "Break at 10:20 · ends 11:20, before the 11:30 lecture" */
  line: string;
  track?: FocusTrackSegment[];
  /** "Start block 3" / "Keep going" */
  confirmLabel: string;
  /** During a break, one short suggestion; it changes from break to break. */
  tip?: string;
}

/** What to do in a break (BT-01), one per break in turn. */
export function breakTip(block: number, t: Translate): string {
  const tips = [
    t('Stand up and stretch.', 'Steh auf und streck dich.'),
    t('Refill your water.', 'Füll dein Wasser nach.'),
    t('Rest your eyes: look out of a window.', 'Gönn deinen Augen eine Pause: Schau aus dem Fenster.'),
    t('Make a coffee or a tea.', 'Mach dir einen Kaffee oder Tee.'),
    t('Walk around for a minute.', 'Geh eine Minute herum.'),
  ];
  return tips[(Math.max(1, block) - 1) % tips.length];
}

/** "ends 11:20, before the 11:30 lecture"; at home "ends 23:15 at the latest". */
function ends(s: ActiveSession, end: string, t: Translate): string {
  if (isHome(s)) return t(`ends ${end} at the latest`, `endet spätestens ${end}`);
  return t(`ends ${end}, ${until(s, t)}`, `endet ${end}, ${until(s, t)}`);
}

function until(s: ActiveSession, t: Translate): string {
  if (s.adopted) return t('started on another device', 'auf einem anderen Gerät gestartet');
  const limit = new Date(s.limitAt ?? s.plannedEnd);
  return s.reason === 'lecture'
    ? t(`before the ${formatTime(limit)} lecture`, `vor der Vorlesung um ${formatTime(limit)}`)
    : s.reason === 'closing'
      ? t('when the campus closes', 'wenn der Campus schließt')
      : t('3 h max', 'max. 3 Std.');
}

export function sessionView(
  s: ActiveSession,
  plan: SessionPlan,
  status: FocusStatus,
  now: Date,
  t: Translate,
): SessionView | null {
  if (status.kind === 'done') return null;
  const open = isOpen(s.rhythm);
  const end = formatTime(plan.end);
  const nowMs = now.getTime();
  const mins = (ms: number) => Math.max(0, Math.ceil(ms / 60000));

  const track: FocusTrackSegment[] | undefined = open
    ? undefined
    : plan.phases.map((p) => {
        const startMs = p.start.getTime();
        const endMs = p.end.getTime();
        const state = nowMs >= endMs ? 'done' : nowMs >= startMs ? 'now' : 'next';
        return {
          kind: p.kind,
          minutes: (endMs - startMs) / 60000,
          state,
          ...(state === 'now' && { progress: (nowMs - startMs) / (endMs - startMs) }),
        };
      });

  if (status.kind === 'confirm') {
    const next = status.phase.block;
    const left = status.deadline.getTime() - nowMs;
    return {
      phase: 'confirm',
      clock: formatElapsed(left),
      title: open ? t('Still focusing?', 'Lernst du noch?') : t("Break's over", 'Pause vorbei'),
      blockLabel: open ? null : t(`Block ${next} of ${plan.blocks}`, `Block ${next} von ${plan.blocks}`),
      clockLabel: t(
        `${mins(left)} minutes left to answer`,
        `Noch ${mins(left)} Minuten zum Antworten`,
      ),
      line: t(
        `No answer by ${formatTime(status.deadline)} ends the session.`,
        `Ohne Antwort bis ${formatTime(status.deadline)} endet die Session.`,
      ),
      track,
      confirmLabel: open ? t('Keep Going', 'Weiter lernen') : t(`Start Block ${next}`, `Block ${next} starten`),
    };
  }

  if (open) {
    const elapsed = nowMs - new Date(s.startedAt).getTime();
    return {
      phase: 'focus',
      clock: formatElapsed(elapsed),
      title: t('Focus', 'Fokus'),
      blockLabel: null,
      clockLabel: t(`${Math.floor(elapsed / 60000)} minutes focused`, `${Math.floor(elapsed / 60000)} Minuten fokussiert`),
      line: isHome(s)
        ? t(`Ends ${end} at the latest`, `Endet spätestens ${end}`)
        : t(`Ends ${end} · ${until(s, t)}`, `Endet ${end} · ${until(s, t)}`),
      confirmLabel: t('Keep Going', 'Weiter lernen'),
    };
  }

  const { phase, next } = status;
  const left = phase.end.getTime() - nowMs;
  if (phase.kind === 'break') {
    const block = next?.block ?? phase.block + 1;
    return {
      phase: 'break',
      clock: formatElapsed(left),
      title: t('Break', 'Pause'),
      blockLabel: t(`Block ${block} of ${plan.blocks} next`, `Danach Block ${block} von ${plan.blocks}`),
      clockLabel: t(`Break, ${mins(left)} minutes left`, `Pause, noch ${mins(left)} Minuten`),
      line: t(`Block ${block} at ${formatTime(phase.end)} · `, `Block ${block} um ${formatTime(phase.end)} · `) + ends(s, end, t),
      track,
      confirmLabel: t(`Start Block ${block}`, `Block ${block} starten`),
      tip: breakTip(phase.block, t),
    };
  }
  return {
    phase: 'focus',
    clock: formatElapsed(left),
    title: t('Focus', 'Fokus'),
    blockLabel: t(`Block ${phase.block} of ${plan.blocks}`, `Block ${phase.block} von ${plan.blocks}`),
    clockLabel: t(
      `${mins(left)} minutes left in block ${phase.block}`,
      `Noch ${mins(left)} Minuten in Block ${phase.block}`,
    ),
    line:
      (next ? t(`Break at ${formatTime(phase.end)} · `, `Pause um ${formatTime(phase.end)} · `) : t('Last block · ', 'Letzter Block · ')) +
      ends(s, end, t),
    track,
    confirmLabel: '',
  };
}

/** "Deep", "Pomodoro", … */
export function rhythmName(r: Rhythm, t: Translate): string {
  const names: Record<PresetId | 'custom', string> = {
    deep: t('Deep', 'Tiefenfokus'),
    pomodoro: 'Pomodoro',
    lecture: t('Lecture', 'Vorlesung'),
    open: t('Open', 'Offen'),
    custom: t('Custom', 'Eigener'),
  };
  return names[rhythmId(r)];
}

/** "50 min focus, 10 min break" / "No breaks, check-in every hour". */
export function rhythmLine(r: Rhythm, t: Translate): string {
  if (isOpen(r)) return t('No breaks · asks every hour', 'Keine Pausen · fragt stündlich');
  const long =
    r.longEvery > 0 && r.longBreak > 0
      ? t(`, ${r.longBreak} min after every ${r.longEvery}th block`, `, ${r.longBreak} Min. nach jedem ${r.longEvery}. Block`)
      : '';
  return t(`${r.focus} min focus, ${r.break} min break${long}`, `${r.focus} Min. Fokus, ${r.break} Min. Pause${long}`);
}

export const PRESET_ORDER: PresetId[] = ['deep', 'pomodoro', 'lecture', 'open'];
export { RHYTHMS };
