import { describe, it, expect } from 'vitest';
import { parseDate, parseDateAsDayOfYear } from '../parseDate.js';

describe('parseDate', () => {
  it('converts "Feb 5" to 205', () => {
    expect(parseDate('Feb 5')).toBe(205);
  });
  it('converts "Mar 11" to 311', () => {
    expect(parseDate('Mar 11')).toBe(311);
  });
  it('handles range like "Mar 7-8" by taking first date', () => {
    expect(parseDate('Mar 7-8')).toBe(307);
  });
});

describe('parseDateAsDayOfYear', () => {
  it('returns 1 for Jan 1', () => {
    expect(parseDateAsDayOfYear('Jan 1')).toBe(1);
  });
  it('returns 32 for Feb 1', () => {
    expect(parseDateAsDayOfYear('Feb 1')).toBe(32);
  });
  it('returns 60 for Mar 1', () => {
    expect(parseDateAsDayOfYear('Mar 1')).toBe(60);
  });
  it('handles range "Mar 7-8" by taking day 7', () => {
    expect(parseDateAsDayOfYear('Mar 7-8')).toBe(66);
  });
  it('returns 121 for May 1', () => {
    expect(parseDateAsDayOfYear('May 1')).toBe(121);
  });
});
