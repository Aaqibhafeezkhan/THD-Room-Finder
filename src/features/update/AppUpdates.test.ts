import { describe, expect, it } from 'vitest';
import { parseManifest, RELEASE_DOWNLOADS } from '../../domain/appUpdate';
import type { UpdatePlan } from '../../domain/appUpdate';
import type { AppUpdater } from '../../data/appUpdater';
import { checkForUpdate } from './AppUpdates';

const manifest = parseManifest({
  schema: 1,
  version: '2.4.0',
  versionCode: 4,
  native: 'abc',
  bundle: { url: `${RELEASE_DOWNLOADS}v2.4.0/web-2.4.0.zip`, sha256: 'b'.repeat(64), size: 1 },
  apk: { url: `${RELEASE_DOWNLOADS}v2.4.0/a.apk`, sha256: 'b'.repeat(64), size: 1 },
})!;

function fake(plan: UpdatePlan | Error) {
  const calls = { checks: 0, downloads: [] as string[] };
  const updater: AppUpdater = {
    ready: async () => undefined,
    check: async () => {
      calls.checks++;
      if (plan instanceof Error) throw plan;
      return plan;
    },
    downloadBundle: async (m) => {
      calls.downloads.push(m.version);
    },
  };
  return { updater, calls };
}

const HOUR = 60 * 60 * 1000;
// Module state carries over, so each test starts well after the last.
let clock = 0;
const later = () => (clock += 100 * HOUR);

describe('app updates', () => {
  it('downloads a live update and then waits six hours before checking again', async () => {
    const { updater, calls } = fake({ kind: 'bundle', manifest });
    const t = later();
    await checkForUpdate(updater, t);
    await checkForUpdate(updater, t + HOUR);
    expect(calls).toEqual({ checks: 1, downloads: ['2.4.0'] });
    await checkForUpdate(updater, t + 7 * HOUR);
    expect(calls.checks).toBe(2);
  });

  it('downloads nothing when the release needs a new APK', async () => {
    const { updater, calls } = fake({ kind: 'apk', manifest });
    await checkForUpdate(updater, later());
    expect(calls.downloads).toEqual([]);
  });

  it('tries again on the next resume after a failed check', async () => {
    const { updater, calls } = fake(new Error('offline'));
    const t = later();
    await checkForUpdate(updater, t);
    await checkForUpdate(updater, t + 1000);
    expect(calls.checks).toBe(2);
  });
});
