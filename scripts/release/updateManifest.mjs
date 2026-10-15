/**
 * Writes update.json for a release (#113): what the Android app reads to keep
 * itself current. `bundle` is the web build for a live update, `apk` the
 * installer for when the native fingerprint changed.
 *
 *   node scripts/release/updateManifest.mjs <tag> <fingerprint> <bundle.zip> <app.apk>
 *
 * Fails when the tag, package.json and android/app/build.gradle disagree on
 * the version, so a release can't ship a manifest the app would misread.
 */
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';

const [tag, fingerprint, bundle, apk] = process.argv.slice(2);
if (!tag || !fingerprint || !bundle || !apk) {
  console.error('usage: updateManifest.mjs <tag> <fingerprint> <bundle.zip> <app.apk>');
  process.exit(1);
}

const version = tag.replace(/^v/, '');
const pkgVersion = JSON.parse(readFileSync('package.json', 'utf8')).version;
const gradle = readFileSync('android/app/build.gradle', 'utf8');
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1]);
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1];
if (pkgVersion !== version || versionName !== version || !Number.isInteger(versionCode)) {
  console.error(`version mismatch: tag ${version}, package.json ${pkgVersion}, versionName ${versionName}, versionCode ${versionCode}`);
  process.exit(1);
}

const repo = process.env.GITHUB_REPOSITORY ?? 'arudaev/THD-Room-Finder';
const download = (file) => `https://github.com/${repo}/releases/download/${tag}/${basename(file)}`;
const asset = (file) => ({
  url: download(file),
  sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  size: statSync(file).size,
});

const manifest = {
  schema: 1,
  version,
  versionCode,
  native: fingerprint,
  notes: `https://github.com/${repo}/releases/tag/${tag}`,
  bundle: asset(bundle),
  apk: asset(apk),
};
console.log(JSON.stringify(manifest, null, 2));
