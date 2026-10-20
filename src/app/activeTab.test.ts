import { describe, expect, it } from 'vitest';
import { activeId } from './activeTab';

describe('active navigation tab', () => {
  it('maps each tab path to its destination', () => {
    expect(activeId('/')).toBe('campus');
    expect(activeId('/rooms')).toBe('rooms');
    expect(activeId('/profile/settings')).toBe('profile');
  });

  it('keeps the tab that opened a room detail highlighted', () => {
    expect(activeId('/room/r1', 'rooms')).toBe('rooms');
    expect(activeId('/room/r1', 'profile')).toBe('profile');
    expect(activeId('/room/r1')).toBe('campus');
  });

  it('keeps the tab that opened a table, gathering or group page highlighted', () => {
    expect(activeId('/t/mossy-lagoon-42', 'profile')).toBe('profile');
    expect(activeId('/g/verdant-squid-51', 'profile')).toBe('profile');
    expect(activeId('/o/campus-connect', 'profile')).toBe('profile');
    expect(activeId('/t/mossy-lagoon-42')).toBe('campus');
  });
});
