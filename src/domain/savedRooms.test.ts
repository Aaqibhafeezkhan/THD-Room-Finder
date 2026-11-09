import { describe, expect, it } from 'vitest';
import { hasSavedRoomChanges, mergeSavedRooms, savedRoomChanges } from './savedRooms';

describe('savedRoomChanges', () => {
  it('reports rooms added and removed since the base', () => {
    expect(savedRoomChanges(['a', 'b'], ['b', 'c'])).toEqual({ add: ['c'], remove: ['a'] });
  });

  it('never removes anything on a first sync, when there is no base', () => {
    expect(savedRoomChanges([], ['a', 'b'])).toEqual({ add: ['a', 'b'], remove: [] });
  });

  it('finds nothing to send when the device matches the base, in any order', () => {
    expect(hasSavedRoomChanges(savedRoomChanges(['a', 'b'], ['b', 'a']))).toBe(false);
  });

  it('counts a repeated room once', () => {
    expect(savedRoomChanges([], ['a', 'a'])).toEqual({ add: ['a'], remove: [] });
  });
});

describe('mergeSavedRooms', () => {
  it('keeps both sides on the first sign-in, device rooms first', () => {
    expect(mergeSavedRooms([], ['phone'], ['laptop', 'shared'])).toEqual(['phone', 'laptop', 'shared']);
  });

  it('does not double a room that both sides have', () => {
    expect(mergeSavedRooms([], ['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('drops a room removed on another device', () => {
    expect(mergeSavedRooms(['a', 'gone'], ['a', 'gone'], ['a'])).toEqual(['a']);
  });

  it('does not bring back a room removed on this device', () => {
    expect(mergeSavedRooms(['a', 'gone'], ['a'], ['a', 'gone'])).toEqual(['a']);
  });

  it('keeps a room added here while the account changed elsewhere', () => {
    expect(mergeSavedRooms(['a'], ['a', 'new-here'], ['a', 'new-there'])).toEqual(['a', 'new-here', 'new-there']);
  });

  it('agrees when both sides removed the same room', () => {
    expect(mergeSavedRooms(['a', 'b'], ['a'], ['a'])).toEqual(['a']);
  });

  it('keeps the order the student has on this device', () => {
    expect(mergeSavedRooms(['z', 'a'], ['z', 'a'], ['a', 'z'])).toEqual(['z', 'a']);
  });

  it('leaves the list empty when the account was emptied elsewhere', () => {
    expect(mergeSavedRooms(['a', 'b'], ['a', 'b'], [])).toEqual([]);
  });

  it('settles: after a merge the device has nothing left to send', () => {
    const remote = ['a', 'new-there'];
    const merged = mergeSavedRooms(['a', 'gone'], ['a', 'gone'], remote);
    expect(hasSavedRoomChanges(savedRoomChanges(remote, merged))).toBe(false);
  });
});
