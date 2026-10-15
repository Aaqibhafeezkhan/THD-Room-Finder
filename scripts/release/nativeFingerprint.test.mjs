import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { nativeFingerprint } from './nativeFingerprint.mjs';

const roots = [];
afterEach(() => roots.splice(0).forEach((r) => rmSync(r, { recursive: true, force: true })));

function project(files) {
  const root = mkdtempSync(join(tmpdir(), 'native-fp-'));
  roots.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

const gradle = (code, name) => `android {\n  defaultConfig {\n    versionCode ${code}\n    versionName "${name}"\n  }\n}\n`;
const lock = (version) =>
  JSON.stringify({ packages: { 'node_modules/@capacitor/app': { version }, 'node_modules/@capacitor/cli': { version: '6.0.0' } } });
const base = {
  'android/app/build.gradle': gradle(3, '2.3.0'),
  'android/app/src/main/AndroidManifest.xml': '<manifest/>\n',
  'android/app/src/main/java/de/A.java': 'class A {}\n',
  'package-lock.json': lock('6.0.0'),
};

describe('native fingerprint', () => {
  it('is the same for a version bump and for Windows line endings', () => {
    const a = nativeFingerprint(project(base));
    const b = nativeFingerprint(
      project({
        ...base,
        'android/app/build.gradle': gradle(4, '2.4.0').replace(/\n/g, '\r\n'),
        'android/app/src/main/java/de/A.java': 'class A {}\r\n',
      }),
    );
    expect(b).toBe(a);
  });

  it('changes with native code, the manifest or a native plugin version', () => {
    const a = nativeFingerprint(project(base));
    expect(nativeFingerprint(project({ ...base, 'android/app/src/main/java/de/B.java': 'class B {}\n' }))).not.toBe(a);
    expect(nativeFingerprint(project({ ...base, 'android/app/src/main/AndroidManifest.xml': '<manifest a=""/>\n' }))).not.toBe(a);
    expect(nativeFingerprint(project({ ...base, 'package-lock.json': lock('6.1.0') }))).not.toBe(a);
  });

  it('ignores web-only changes and the CLI version', () => {
    const a = nativeFingerprint(project(base));
    const lockCli = JSON.stringify({
      packages: { 'node_modules/@capacitor/app': { version: '6.0.0' }, 'node_modules/@capacitor/cli': { version: '6.9.9' } },
    });
    expect(nativeFingerprint(project({ ...base, 'src/main.tsx': 'x', 'package-lock.json': lockCli }))).toBe(a);
  });
});
