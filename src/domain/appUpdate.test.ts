import { describe, expect, it } from 'vitest';
import { compareVersions, parseManifest, planUpdate, RELEASE_DOWNLOADS } from './appUpdate';

const sha = 'a'.repeat(64);
const raw = {
  schema: 1,
  version: '2.4.0',
  versionCode: 4,
  native: 'abc123',
  notes: 'https://github.com/arudaev/THD-Room-Finder/releases/tag/v2.4.0',
  bundle: { url: `${RELEASE_DOWNLOADS}v2.4.0/web-2.4.0.zip`, sha256: sha, size: 1200000 },
  apk: { url: `${RELEASE_DOWNLOADS}v2.4.0/thd-room-finder-2.4.0.apk`, sha256: sha, size: 3500000 },
};
const app = { version: '2.3.0', native: 'abc123', versionCode: 3 };

describe('update manifest', () => {
  it('reads a release manifest, also as text', () => {
    expect(parseManifest(raw)?.version).toBe('2.4.0');
    expect(parseManifest(JSON.stringify(raw))?.bundle.size).toBe(1200000);
  });

  it('rejects assets from anywhere but this repository’s releases', () => {
    expect(parseManifest({ ...raw, bundle: { ...raw.bundle, url: 'https://evil.example/web.zip' } })).toBeNull();
    expect(parseManifest({ ...raw, apk: { ...raw.apk, url: `${RELEASE_DOWNLOADS}../../x.apk` } })).toBeNull();
  });

  it('rejects a missing checksum, a bad version or another schema', () => {
    expect(parseManifest({ ...raw, bundle: { ...raw.bundle, sha256: 'abc' } })).toBeNull();
    expect(parseManifest({ ...raw, version: 'latest' })).toBeNull();
    expect(parseManifest({ ...raw, schema: 2 })).toBeNull();
    expect(parseManifest('<html>Not Found</html>')).toBeNull();
    expect(parseManifest(null)).toBeNull();
  });
});

describe('update plan', () => {
  const manifest = parseManifest(raw)!;

  it('updates the web bundle silently when the native shell is the same', () => {
    expect(planUpdate(manifest, app).kind).toBe('bundle');
  });

  it('asks for the new APK when the native shell changed', () => {
    expect(planUpdate({ ...manifest, native: 'def456' }, app).kind).toBe('apk');
  });

  it('does nothing when the app is current or ahead', () => {
    expect(planUpdate(manifest, { ...app, version: '2.4.0' }).kind).toBe('none');
    expect(planUpdate(manifest, { ...app, version: '2.10.0' }).kind).toBe('none');
    expect(planUpdate(null, app).kind).toBe('none');
  });

  it('does not offer an APK that is not newer than the installed one', () => {
    expect(planUpdate({ ...manifest, native: 'def456', versionCode: 3 }, app).kind).toBe('none');
  });

  it('compares versions numerically', () => {
    expect(compareVersions('2.10.0', '2.9.9')).toBeGreaterThan(0);
    expect(compareVersions('2.3.0', '2.3.0')).toBe(0);
    expect(compareVersions('1.9.0', '2.0.0')).toBeLessThan(0);
  });
});
