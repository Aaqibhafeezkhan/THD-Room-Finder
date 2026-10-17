/**
 * Fingerprint of the Android native shell (#113): the android/ sources and
 * resources, the Capacitor config and the native plugin versions. The app is
 * built with it and every release writes it into update.json, so the app can
 * tell a web-only release (same fingerprint: live update) from one that needs
 * a new APK (different fingerprint: update prompt).
 *
 * Line endings and the release's own versionCode/versionName lines are
 * ignored, so a Windows checkout and a version bump hash the same.
 *
 *   node scripts/release/nativeFingerprint.mjs   → prints the fingerprint
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Files and folders that end up in the APK's native part. */
const INPUTS = [
  'capacitor.config.ts',
  'android/build.gradle',
  'android/variables.gradle',
  'android/settings.gradle',
  'android/capacitor.settings.gradle',
  'android/gradle.properties',
  'android/app/build.gradle',
  'android/app/capacitor.build.gradle',
  'android/app/proguard-rules.pro',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/java',
  'android/app/src/main/res',
];

/** Written by `cap sync`, so absent on a fresh checkout. */
const GENERATED = new Set(['android/app/src/main/res/xml/config.xml']);

const TEXT = /\.(java|kt|xml|gradle|ts|properties|pro|json)$/;
const VERSION_LINE = /^\s*version(Code|Name)\b.*$/gm;

function files(root, path) {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (!statSync(full).isDirectory()) return [path];
  return readdirSync(full)
    .sort()
    .flatMap((name) => files(root, `${path}/${name}`))
    .filter((file) => !GENERATED.has(file));
}

function content(root, path) {
  const bytes = readFileSync(join(root, path));
  if (!TEXT.test(path)) return bytes;
  let text = bytes.toString('utf8').replace(/\r\n?/g, '\n');
  if (path === 'android/app/build.gradle') text = text.replace(VERSION_LINE, '');
  return Buffer.from(text, 'utf8');
}

/** Installed versions of the packages with native Android code. */
function nativePackages(root) {
  const lockPath = join(root, 'package-lock.json');
  if (!existsSync(lockPath)) return [];
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  return Object.entries(lock.packages ?? {})
    .filter(([key]) => /^node_modules\/(@capacitor\/(?!cli$|assets$)[^/]+|@capgo\/[^/]+)$/.test(key))
    .map(([key, value]) => `${key.slice('node_modules/'.length)}@${value.version}`)
    .sort();
}

/** 16 hex characters of a SHA-256 over every native input. */
export function nativeFingerprint(root = process.cwd()) {
  const hash = createHash('sha256');
  for (const path of INPUTS.flatMap((input) => files(root, input))) {
    hash.update(`${path}\0`);
    hash.update(content(root, path));
    hash.update('\0');
  }
  for (const pkg of nativePackages(root)) hash.update(`${pkg}\0`);
  return hash.digest('hex').slice(0, 16);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(nativeFingerprint());
}
