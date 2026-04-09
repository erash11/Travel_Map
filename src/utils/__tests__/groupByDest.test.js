import { describe, it, expect } from 'vitest';
import { groupByDest } from '../groupByDest.js';

const games = [
  { date: 'Feb 5', opponent: 'A', location: 'Waco, TX', lat: 31.5, lng: -97.1, home: true, tripId: null },
  { date: 'Feb 6', opponent: 'B', location: 'Waco, TX', lat: 31.5, lng: -97.1, home: true, tripId: null },
  { date: 'Feb 12', opponent: 'C', location: 'San Diego, CA', lat: 32.7, lng: -117.0, home: false, tripId: null },
  { date: 'Feb 13', opponent: 'D', location: 'San Diego, CA', lat: 32.7, lng: -117.0, home: false, tripId: null },
  { date: 'Mar 11', opponent: 'E', location: 'DeLand, FL', lat: 29.0, lng: -81.3, home: false, tripId: 'florida-swing' },
];

describe('groupByDest', () => {
  it('merges games at the same lat/lng', () => {
    const result = groupByDest(games);
    expect(result).toHaveLength(3);
  });

  it('groups games into the games array per destination', () => {
    const result = groupByDest(games);
    const waco = result.find(d => d.location === 'Waco, TX');
    expect(waco.games).toHaveLength(2);
  });

  it('preserves tripId on destination', () => {
    const result = groupByDest(games);
    const deland = result.find(d => d.location === 'DeLand, FL');
    expect(deland.tripId).toBe('florida-swing');
  });

  it('sets tripId to null for destinations without a trip', () => {
    const result = groupByDest(games);
    const sd = result.find(d => d.location === 'San Diego, CA');
    expect(sd.tripId).toBeNull();
  });
});
