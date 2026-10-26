"""Synthesises the focus-session sounds (docs/product/focus-at-home.md).

Every sound is made here from sine partials and filtered noise, so the app
owns them outright and anyone can change one and render it again:

    python scripts/dev/focus_sounds.py            # writes public/sounds/*.mp3
    python scripts/dev/focus_sounds.py --android  # also android/.../res/raw/*.ogg
    python scripts/dev/focus_sounds.py --wav DIR  # WAV copies for listening

Each set has three sounds. The rule that ties them together: down for a
break, up for focus. A break falls or settles, back-to-focus rises, and done
resolves. Nothing is longer than 2.5 s, attacks are soft and peaks sit at
-6 dBFS, so no sound startles. Needs numpy and ffmpeg (libmp3lame, libvorbis).
"""

from __future__ import annotations

import argparse
import pathlib
import subprocess
import tempfile
import wave

import numpy as np

RATE = 44100
ROOT = pathlib.Path(__file__).resolve().parents[2]
WEB_DIR = ROOT / "public" / "sounds"
ANDROID_DIR = ROOT / "android" / "app" / "src" / "main" / "res" / "raw"
PEAK = 10 ** (-6 / 20)

rng = np.random.default_rng(2026)


def hz(note: str) -> float:
    """'A4' -> 440 Hz; sharps as 'C#5'."""
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    name, octave = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[name] + 12 * (octave - 4)) / 12)


def silence(seconds: float) -> np.ndarray:
    return np.zeros(int(seconds * RATE))


def t_axis(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * RATE)) / RATE


def attack(x: np.ndarray, ms: float) -> np.ndarray:
    n = min(len(x), int(ms * RATE / 1000))
    x = x.copy()
    x[:n] *= np.sin(np.linspace(0, np.pi / 2, n)) ** 2
    return x


def fade_out(x: np.ndarray, ms: float) -> np.ndarray:
    n = min(len(x), int(ms * RATE / 1000))
    x = x.copy()
    x[-n:] *= np.cos(np.linspace(0, np.pi / 2, n)) ** 2
    return x


def mix(parts: list[tuple[float, np.ndarray]], seconds: float = 0.0) -> np.ndarray:
    """Places each (start in s, signal) on one track, long enough for all."""
    end = max(int(start * RATE) + len(sig) for start, sig in parts)
    out = np.zeros(max(end, int(seconds * RATE)))
    for start, sig in parts:
        i = int(start * RATE)
        n = min(len(sig), len(out) - i)
        if n > 0:
            out[i : i + n] += sig[:n]
    return out


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    """One-pole low-pass, enough to round off clicks and hiss."""
    a = np.exp(-2 * np.pi * cutoff / RATE)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def room(x: np.ndarray, seconds: float = 0.9, wet: float = 0.16) -> np.ndarray:
    """A small, soft room so the sounds don't feel dry and close."""
    n = int(seconds * RATE)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.18 * RATE))
    ir = lowpass(ir, 3500)
    ir /= np.sqrt(np.sum(ir**2))
    dry = np.concatenate([x, np.zeros(n - 1)])
    tail = np.convolve(x, ir)
    return (1 - wet) * dry + wet * tail


def finish(x: np.ndarray) -> np.ndarray:
    x = room(x)
    # Trim the silent tail, then normalise.
    loud = np.nonzero(np.abs(x) > 2e-3 * np.max(np.abs(x)))[0]
    x = x[: loud[-1] + 1] if len(loud) else x
    x = fade_out(x, 60)
    return x / np.max(np.abs(x)) * PEAK


# ── Instruments ─────────────────────────────────────────────────────────────


def marimba(note: str, seconds: float = 0.9, level: float = 1.0) -> np.ndarray:
    """Wooden bar: a strong fundamental, a 4th partial that dies fast, a soft mallet."""
    f = hz(note)
    t = t_axis(seconds)
    body = (
        np.sin(2 * np.pi * f * t) * np.exp(-t / 0.32)
        + 0.32 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.06)
        + 0.10 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.02)
    )
    mallet = lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.25
    return fade_out(attack(body + mallet, 3), 120) * level


def bell(note: str, seconds: float = 2.4, level: float = 1.0) -> np.ndarray:
    """Small bell: inharmonic partials with long, staggered tails."""
    f = hz(note)
    t = t_axis(seconds)
    partials = [(1.0, 1.0, 1.4), (2.76, 0.42, 0.7), (5.40, 0.20, 0.35), (8.93, 0.08, 0.18)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in partials)
    return fade_out(attack(x, 4), 400) * level


def ding(note: str, seconds: float = 1.4, level: float = 1.0) -> np.ndarray:
    """Bright glass ding for 'ready': near-harmonic, clear, quick to settle."""
    f = hz(note)
    t = t_axis(seconds)
    x = (
        np.sin(2 * np.pi * f * t) * np.exp(-t / 0.55)
        + 0.30 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.25)
        + 0.12 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.12)
    )
    return fade_out(attack(x, 3), 300) * level


def keys(notes: list[str], seconds: float = 2.2, level: float = 1.0) -> np.ndarray:
    """Soft electric-piano chord that swells in and breathes (tremolo)."""
    t = t_axis(seconds)
    x = np.zeros_like(t)
    for i, n in enumerate(notes):
        f = hz(n)
        x += (np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t)) * (0.9 ** i)
    env = (1 - np.exp(-t / 0.05)) * np.exp(-t / 0.9)
    tremolo = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return fade_out(x * env * tremolo / len(notes) * 2.2, 400) * level


def clink(seconds: float = 0.35, pitch: float = 1.0, level: float = 1.0) -> np.ndarray:
    """A spoon tapping a ceramic cup: high inharmonic partials, very short."""
    t = t_axis(seconds)
    partials = [(2350, 1.0, 0.09), (3870, 0.55, 0.06), (5120, 0.35, 0.04), (6940, 0.18, 0.025)]
    x = sum(a * np.sin(2 * np.pi * f * pitch * t) * np.exp(-t / d) for f, a, d in partials)
    return fade_out(attack(x, 1), 60) * level


def pour(seconds: float = 1.35) -> np.ndarray:
    """Coffee poured into a cup. Liquid sounds are mostly bubbles: short sine
    blips that glide up as they close. Their pitch rises as the cup fills,
    over a quiet, dark splash bed."""
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    fill = lambda at: 480 + 700 * (at / seconds) ** 1.2
    for _ in range(170):
        at = rng.uniform(0.02, seconds - 0.08)
        f0 = fill(at) * rng.uniform(0.75, 1.35)
        dur = rng.uniform(0.012, 0.045)
        k = np.arange(int(dur * RATE)) / RATE
        glide = f0 * (1 + 0.9 * k / dur)
        blip = np.sin(2 * np.pi * np.cumsum(glide) / RATE) * np.exp(-k / (dur / 3))
        i = int(at * RATE)
        out[i : i + len(blip)] += blip[: n - i] * rng.uniform(0.25, 1.0)
    splash = lowpass(lowpass(rng.standard_normal(n), 1400), 1400) * 2.2
    env = np.minimum(1, t / 0.1) * np.minimum(1, (seconds - t) / 0.3)
    return lowpass(out * 0.55 + splash * 0.35, 5000) * env


# ── Sets: break (down), back (up), done (resolve) ────────────────────────────


def coffee_break():
    brk = mix([(0.0, pour() * 0.9), (1.38, clink(level=0.55)), (1.58, clink(pitch=1.06, level=0.35))], 2.2)
    back = mix(
        [(0.0, ding("G5", level=0.75)), (0.16, ding("C6", level=0.8)), (0.32, ding("E6", level=0.9)), (0.32, ding("C5", level=0.25))],
        1.9,
    )
    done = mix([(0.0, keys(["C4", "E4", "G4", "B4", "D5"])), (0.05, ding("G6", level=0.18))], 2.4)
    return brk, back, done


def jingle():
    brk = mix([(0.0, marimba("G5")), (0.17, marimba("E5")), (0.34, marimba("C5", 1.2))], 1.7)
    back = mix(
        [(0.0, marimba("C5")), (0.11, marimba("E5")), (0.22, marimba("G5")), (0.36, marimba("C6", 1.1)), (0.36, marimba("C5", 1.1, 0.5))],
        1.6,
    )
    done = mix(
        [(0.0, marimba("G4")), (0.1, marimba("C5")), (0.2, marimba("E5")), (0.3, marimba("G5")),
         (0.46, marimba("C6", 1.3)), (0.46, marimba("E5", 1.3, 0.6)), (0.46, marimba("C5", 1.3, 0.5))],
        2.0,
    )
    return brk, back, done


def chimes():
    brk = mix([(0.0, bell("E6", level=0.7)), (0.26, bell("C6", level=0.6)), (0.52, bell("A5", level=0.55))], 2.5)
    back = mix([(0.0, bell("A5", 1.6, 0.6)), (0.14, bell("C#6", 1.6, 0.65)), (0.28, bell("E6", 1.6, 0.75)), (0.42, bell("A6", 1.6, 0.6))], 2.1)
    t = t_axis(2.5)
    bowl = (np.sin(2 * np.pi * 220 * t) + np.sin(2 * np.pi * 221.6 * t) + 0.3 * np.sin(2 * np.pi * 220 * 2.71 * t)) * np.exp(-t / 1.1)
    done = mix([(0.0, fade_out(attack(bowl, 30), 500) * 0.6), (0.0, bell("E5", 2.4, 0.25))])
    return brk, back, done


SETS = {"coffee": coffee_break, "jingle": jingle, "chimes": chimes}
EVENTS = ("break", "back", "done")


def write_wav(path: pathlib.Path, x: np.ndarray) -> None:
    pcm = np.clip(x * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm.tobytes())


def encode(src: pathlib.Path, dst: pathlib.Path, codec: list[str]) -> None:
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), *codec, "-map_metadata", "-1", str(dst)],
        check=True,
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--android", action="store_true", help="also write Ogg files to res/raw")
    p.add_argument("--wav", type=pathlib.Path, help="also keep WAV copies in this folder")
    args = p.parse_args()
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for name, make in SETS.items():
            for event, x in zip(EVENTS, make()):
                wav = pathlib.Path(tmp) / f"{name}-{event}.wav"
                write_wav(wav, finish(x))
                encode(wav, WEB_DIR / f"{name}-{event}.mp3", ["-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k"])
                if args.android:
                    ANDROID_DIR.mkdir(parents=True, exist_ok=True)
                    encode(wav, ANDROID_DIR / f"focus_{name}_{event}.ogg", ["-ac", "1", "-c:a", "libvorbis", "-q:a", "3"])
                if args.wav:
                    args.wav.mkdir(parents=True, exist_ok=True)
                    (args.wav / wav.name).write_bytes(wav.read_bytes())
                print(f"{name}-{event}: {len(x) / RATE:.2f} s")


if __name__ == "__main__":
    main()
