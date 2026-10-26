import { Capacitor } from '@capacitor/core';
import type { SoundEvent, SoundMoment } from '../domain/focusSounds';

/**
 * Plays a session's sounds in the page (ADR 0012). The files are decoded once
 * and scheduled on the audio clock, which keeps time in a background tab, so
 * a break sounds on time while the student works in another window. Browsers
 * only let audio start after a tap: until then (after a reload, say) the
 * player is locked, and the next tap anywhere unlocks it.
 *
 * In the Android app the notification plays the sounds, with the phone
 * locked too, so the page only plays previews there.
 */
export interface SoundPlayer {
  /** False in the Android app: its notification plays the session's sounds. */
  schedules: boolean;
  /** Call from a tap: creates or resumes audio. */
  unlock(): void;
  /** Audio is waiting for a tap. */
  locked(): boolean;
  onChange(cb: () => void): () => void;
  /** Replaces whatever was scheduled. */
  schedule(set: string, moments: SoundMoment[]): Promise<void>;
  cancel(): void;
  /** The break sound, then the break's-over sound, now. */
  preview(set: string): Promise<void>;
}

const VOLUME = 0.9;
const QUIET = 0.45;
const BASE = '/sounds/';

type Ctx = AudioContext;

function webPlayer(native: boolean): SoundPlayer {
  let ctx: Ctx | null = null;
  const buffers = new Map<string, Promise<AudioBuffer | null>>();
  let sources: AudioBufferSourceNode[] = [];
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((cb) => cb());

  const context = (): Ctx | null => {
    if (ctx) return ctx;
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    ctx.onstatechange = notify;
    return ctx;
  };

  const load = (set: string, event: SoundEvent): Promise<AudioBuffer | null> => {
    const key = `${set}-${event}`;
    let p = buffers.get(key);
    if (!p) {
      p = fetch(`${BASE}${key}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`sound ${r.status}`))))
        .then((data) => context()?.decodeAudioData(data) ?? null)
        .catch(() => {
          // Missing or undecodable: the notification still alerts; try again later.
          buffers.delete(key);
          return null;
        });
      buffers.set(key, p);
    }
    return p;
  };

  const play = (buffer: AudioBuffer, when: number, volume: number) => {
    const c = context();
    if (!c) return null;
    const source = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain).connect(c.destination);
    source.start(when);
    return source;
  };

  const cancel = () => {
    for (const s of sources) {
      try {
        s.stop();
      } catch {
        /* already played */
      }
    }
    sources = [];
  };

  return {
    schedules: !native,
    unlock() {
      const c = context();
      if (c && c.state !== 'running') void c.resume().then(notify, () => undefined);
    },
    locked: () => !ctx || ctx.state !== 'running',
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async schedule(set, moments) {
      cancel();
      if (native || !moments.length) return;
      const c = context();
      if (!c) return;
      const now = Date.now();
      const base = c.currentTime;
      const planned = await Promise.all(moments.map(async (m) => ({ m, buffer: await load(set, m.event) })));
      // Decoding took a moment; measure from the same instant as `now`.
      const shift = c.currentTime - base;
      for (const { m, buffer } of planned) {
        if (!buffer) continue;
        const delay = (m.at.getTime() - now) / 1000 - shift;
        if (delay < -1) continue;
        const s = play(buffer, c.currentTime + Math.max(0, delay), m.quiet ? QUIET : VOLUME);
        if (s) sources.push(s);
      }
    },
    cancel,
    async preview(set) {
      const c = context();
      if (!c) return;
      if (c.state !== 'running') await c.resume().catch(() => undefined);
      const [brk, back] = await Promise.all([load(set, 'break'), load(set, 'back')]);
      const start = c.currentTime + 0.05;
      if (brk) play(brk, start, VOLUME);
      if (back) play(back, start + (brk?.duration ?? 0) + 0.35, VOLUME);
    },
  };
}

function noPlayer(): SoundPlayer {
  return {
    schedules: false,
    unlock: () => {},
    locked: () => false,
    onChange: () => () => {},
    schedule: async () => {},
    cancel: () => {},
    preview: async () => {},
  };
}

let instance: SoundPlayer | null = null;

export function soundPlayer(): SoundPlayer {
  instance ??=
    typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)
      ? webPlayer(Capacitor.getPlatform() === 'android')
      : noPlayer();
  return instance;
}
