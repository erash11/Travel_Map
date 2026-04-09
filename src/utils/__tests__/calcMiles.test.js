import { describe, it, expect } from 'vitest';
import { calcTotalMiles } from '../calcMiles.js';

const HOME = { lat: 31.5493, lng: -97.1467 };

const SD = { location: 'San Diego, CA', lat: 32.7749, lng: -117.0714, tripId: null };
const DELAND = { location: 'DeLand, FL', lat: 29.0283, lng: -81.3032, tripId: 'florida-swing' };
const ORLANDO = { location: 'Orlando, FL', lat: 28.6024, lng: -81.2001, tripId: 'florida-swing' };

const trips = [
  { id: 'florida-swing', label: 'Florida Swing', stops: ['DeLand, FL', 'Orlando, FL'] },
];

describe('calcTotalMiles', () => {
  it('doubles a single away trip (round trip)', () => {
    const miles = calcTotalMiles([SD], [], HOME);
    // Waco→San Diego ~1167 miles one-way, round trip ~2334 miles
    expect(miles).toBeGreaterThan(2300);
    expect(miles).toBeLessThan(2370);
  });

  it('models a multi-stop trip as a chain, not double round trips', () => {
    const chain = calcTotalMiles([DELAND, ORLANDO], trips, HOME);
    const naiveDoubled = calcTotalMiles([DELAND, ORLANDO], [], HOME);
    expect(chain).toBeLessThan(naiveDoubled);
  });

  it('counts trip mileage once even if both stops appear in awayDests', () => {
    const once = calcTotalMiles([DELAND, ORLANDO], trips, HOME);
    // Waco→DeLand→Orlando→Waco should be roughly 1700-2200 miles
    expect(once).toBeGreaterThan(1700);
    expect(once).toBeLessThan(2200);
  });

  it('returns 0 for empty list', () => {
    expect(calcTotalMiles([], [], HOME)).toBe(0);
  });
});
