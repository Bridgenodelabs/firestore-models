import { describe, it, expect } from 'vitest';
import { dateFromTimestamp, timestampFromDate } from './convert.js';

// ---------------------------------------------------------------------------
// dateFromTimestamp
// ---------------------------------------------------------------------------

describe('dateFromTimestamp', () => {
  it('returns the same Date instance when given a Date', () => {
    const d = new Date('2025-01-01T00:00:00.000Z');
    expect(dateFromTimestamp(d)).toBe(d);
  });

  it('converts via toDate() duck type', () => {
    const expected = new Date('2025-06-15T12:00:00.000Z');
    const result = dateFromTimestamp({ toDate: () => expected });
    expect(result).toEqual(expected);
  });

  it('converts from seconds + nanoseconds shape', () => {
    // 1_700_000_000 s + 500_000_000 ns = 1_700_000_000.5 s
    const result = dateFromTimestamp({ seconds: 1_700_000_000, nanoseconds: 500_000_000 });
    expect(result.toISOString()).toBe('2023-11-14T22:13:20.500Z');
  });

  it('converts from _seconds + _nanoseconds shape (Firestore serialized form)', () => {
    // Same epoch as above but using underscore-prefixed keys
    const result = dateFromTimestamp({ _seconds: 1_700_000_000, _nanoseconds: 500_000_000 });
    expect(result.toISOString()).toBe('2023-11-14T22:13:20.500Z');
  });

  it('uses _seconds/_nanoseconds when both pairs are present (seconds takes precedence)', () => {
    // seconds/nanoseconds are checked first via ?? operator
    const result = dateFromTimestamp({
      seconds: 1_700_000_000,
      nanoseconds: 0,
      _seconds: 0,
      _nanoseconds: 0,
    });
    expect(result.getTime()).toBe(1_700_000_000 * 1000);
  });

  it('floors sub-millisecond nanoseconds (no fractional ms in Date)', () => {
    // 999_999 ns = 0.999999 ms → floored to 0 ms
    const result = dateFromTimestamp({ seconds: 0, nanoseconds: 999_999 });
    expect(result.getTime()).toBe(0);
  });

  it('throws for an object with no valid timestamp shape', () => {
    expect(() => dateFromTimestamp({} as never)).toThrow('Invalid TimestampLike value');
  });

  it('throws when seconds is present but nanoseconds resolves to non-number', () => {
    // toDate is absent, seconds is a string → falls through to the number check
    expect(() =>
      dateFromTimestamp({ seconds: 'bad' as unknown as number }),
    ).toThrow('Invalid TimestampLike value');
  });
});

// ---------------------------------------------------------------------------
// timestampFromDate
// ---------------------------------------------------------------------------

describe('timestampFromDate', () => {
  it('calls the factory with the provided Date and returns its result', () => {
    const date = new Date('2025-01-01T00:00:00.000Z');
    const factory = (d: Date) => ({ iso: d.toISOString() });
    const result = timestampFromDate(date, factory);
    expect(result).toEqual({ iso: '2025-01-01T00:00:00.000Z' });
  });

  it('forwards the exact Date reference to the factory', () => {
    const date = new Date();
    let received: Date | null = null;
    timestampFromDate(date, (d) => { received = d; return d; });
    expect(received).toBe(date);
  });

  it('returns whatever the factory returns', () => {
    const sentinel = Symbol('ts');
    const result = timestampFromDate(new Date(), () => sentinel as unknown as { seconds: number; nanoseconds: number });
    expect(result).toBe(sentinel);
  });
});
