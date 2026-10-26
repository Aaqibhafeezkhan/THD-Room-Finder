import { describe, expect, it } from 'vitest';
import { getCampusHours } from '../../domain/openingHours';
import { profileAccessStatus } from './accessCopy';

describe('profile access copy', () => {
  it('does not call an unconfirmed weekend a physical closure', () => {
    expect(profileAccessStatus(getCampusHours(new Date(2026, 9, 18, 12)), en => en)).toBe('Weekend · Focus at home still counts');
  });
  it('keeps Christmas closure and ordinary after-hours different', () => {
    expect(profileAccessStatus(getCampusHours(new Date(2026, 11, 25, 12)), en => en)).toContain('Campus closed today');
    expect(profileAccessStatus(getCampusHours(new Date(2026, 9, 19, 23)), en => en)).toBe('Outside classroom opening hours');
  });
});
