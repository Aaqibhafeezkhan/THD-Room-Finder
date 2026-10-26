import { useEffect, useRef, useState } from 'react';
import { soundPlayer } from '../../data/focusSounds';
import type { SoundPlayer } from '../../data/focusSounds';
import { soundMoments } from '../../domain/focusSounds';
import { isHome, useFocusSession } from './FocusSessionContext';
import type { ActiveSession } from './FocusSessionContext';
import { isPlayable, useSoundPreference } from './soundPreference';
import type { SoundSet } from './soundPreference';

/** The set a session plays: its place's choice, or Silent when muted. */
export function sessionSound(s: ActiveSession | null, prefs: Record<'home' | 'campus', SoundSet>): SoundSet {
  if (!s || s.muted) return 'silent';
  return prefs[isHome(s) ? 'home' : 'campus'];
}

/**
 * Plays the running session's sounds in the page (ADR 0012): rescheduled
 * when the phase changes, a block is confirmed, the set or mute changes, and
 * when the page comes back. Quiet in the Android app (its notification
 * plays them) and for a session picked up from another device until a block
 * is confirmed here. Renders nothing.
 */
export function FocusSounds({ player = soundPlayer() }: { player?: SoundPlayer }) {
  const focus = useFocusSession();
  const [prefs] = useSoundPreference();
  const latest = useRef(focus);
  latest.current = focus;
  const { active, status } = focus;
  const set = sessionSound(active, prefs);
  const plays = player.schedules && isPlayable(set) && Boolean(active && !active.adopted);
  const key =
    plays && active && status && status.kind !== 'done'
      ? `${active.startedAt}|${active.confirmed}|${status.kind}|${'phase' in status ? status.phase.block : ''}|${set}`
      : '';

  useEffect(() => {
    const schedule = () => {
      const { active: s, plan } = latest.current;
      if (!key || !s || !plan) {
        player.cancel();
        return;
      }
      void player.schedule(set, soundMoments(plan, s.confirmed, new Date())).catch(() => undefined);
    };
    schedule();
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    document.addEventListener('visibilitychange', onVisible);
    // Audio waits for a tap after a reload: the next one anywhere unlocks it.
    const onTap = () => {
      if (!player.locked()) return;
      player.unlock();
      schedule();
    };
    if (key) {
      document.addEventListener('pointerdown', onTap, true);
      document.addEventListener('keydown', onTap, true);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('pointerdown', onTap, true);
      document.removeEventListener('keydown', onTap, true);
    };
  }, [key, set, player]);

  useEffect(() => () => player.cancel(), [player]);
  return null;
}

/** True while a running session's sounds wait for a tap (web, after a reload). */
export function useSoundsLocked(player: SoundPlayer = soundPlayer()): boolean {
  const { active } = useFocusSession();
  const [prefs] = useSoundPreference();
  const [locked, setLocked] = useState(() => player.locked());
  useEffect(() => {
    const update = () => setLocked(player.locked());
    update();
    return player.onChange(update);
  }, [player]);
  return Boolean(active && !active.adopted && player.schedules && isPlayable(sessionSound(active, prefs)) && locked);
}
