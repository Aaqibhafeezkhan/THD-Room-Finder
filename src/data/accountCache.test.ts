import { beforeEach, describe, expect, it } from 'vitest';
import { forgetAccount, readAccount, readStale, write, writeAccount } from './cache';

beforeEach(() => localStorage.clear());

describe('account cache', () => {
  it('only gives the saved answer back to the same student', () => {
    writeAccount('tables', 'lena@stud.th-deg.de', [1, 2]);
    expect(readAccount('tables', 'lena@stud.th-deg.de')).toEqual([1, 2]);
    expect(readAccount('tables', 'max@stud.th-deg.de')).toBeNull();
  });

  it('forgets everything personal on sign-out and keeps the timetable cache', () => {
    writeAccount('identity', 'lena@stud.th-deg.de', { displayName: 'Lena' });
    write('thd_rooms', ['A008']);
    forgetAccount();
    expect(readAccount('identity', 'lena@stud.th-deg.de')).toBeNull();
    expect(readStale('thd_rooms')).toEqual(['A008']);
  });
});
