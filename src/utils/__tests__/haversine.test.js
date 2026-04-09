import { describe, it, expect } from 'vitest';
import { haversine } from '../haversine.js';

describe('haversine', () => {
  it('returns 0 for identical points', () => {
    expect(haversine(31.5493, -97.1467, 31.5493, -97.1467)).toBe(0);
  });

  it('calculates Waco to San Diego within 10 miles of 1167', () => {
    const dist = haversine(31.5493, -97.1467, 32.7749, -117.0714);
    expect(dist).toBeGreaterThan(1157);
    expect(dist).toBeLessThan(1177);
  });

  it('calculates Waco to Clemson within 10 miles of 855', () => {
    const dist = haversine(31.5493, -97.1467, 34.6834, -82.8374);
    expect(dist).toBeGreaterThan(845);
    expect(dist).toBeLessThan(865);
  });
});
