// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import {
  computeChecklistExpiry,
  loadStoredChecked,
  saveCheckedState,
} from '@/lib/checklistPersistence';

describe('computeChecklistExpiry', () => {
  it('bruger den aktuelle godkendte bookings slutdato + 1 dag', () => {
    const bookings = [
      { status: 'approved', startDate: '2026-07-20', endDate: '2026-07-26' },
    ];
    expect(computeChecklistExpiry(bookings, '2026-07-23')).toBe('2026-07-27');
  });

  it('ignorerer ønsker (kun godkendte bookinger tæller)', () => {
    const bookings = [
      { status: 'request', startDate: '2026-07-20', endDate: '2026-07-26' },
    ];
    // Ingen aktuel godkendt booking -> falder tilbage til i dag + 1 dag.
    expect(computeChecklistExpiry(bookings, '2026-07-23')).toBe('2026-07-24');
  });

  it('vælger den senest afsluttende booking, hvis flere dækker i dag', () => {
    const bookings = [
      { status: 'approved', startDate: '2026-07-20', endDate: '2026-07-24' },
      { status: 'approved', startDate: '2026-07-22', endDate: '2026-07-28' },
    ];
    expect(computeChecklistExpiry(bookings, '2026-07-23')).toBe('2026-07-29');
  });

  it('falder tilbage til i dag + 1 dag, hvis ingen booking dækker i dag', () => {
    expect(computeChecklistExpiry([], '2026-07-23')).toBe('2026-07-24');
  });
});

describe('loadStoredChecked / saveCheckedState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('gemmer og genindlæser afkrydsninger, når udløbsdatoen ikke er passeret', () => {
    saveCheckedState('2026-07-27', new Set(['a', 'b']));
    const result = loadStoredChecked('2026-07-25');
    expect(result.has('a')).toBe(true);
    expect(result.has('b')).toBe(true);
  });

  it('bevarer afkrydsningerne PÅ selve udløbsdatoen (inklusiv)', () => {
    saveCheckedState('2026-07-27', new Set(['a']));
    const result = loadStoredChecked('2026-07-27');
    expect(result.has('a')).toBe(true);
  });

  it('rydder afkrydsningerne dagen efter udløbsdatoen', () => {
    saveCheckedState('2026-07-27', new Set(['a']));
    const result = loadStoredChecked('2026-07-28');
    expect(result.size).toBe(0);
    expect(window.localStorage.getItem('mallorca-checklist-v1')).toBeNull();
  });

  it('returnerer tomt sæt, hvis intet er gemt endnu', () => {
    const result = loadStoredChecked('2026-07-23');
    expect(result.size).toBe(0);
  });
});
