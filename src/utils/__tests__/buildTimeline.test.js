import { describe, it, expect } from 'vitest';
import { buildTimeline } from '../buildTimeline.js';
import { groupByDest } from '../groupByDest.js';
import { calcTotalMiles } from '../calcMiles.js';
import softball from '../../data/softball.json';

const HOME = { city: 'Waco, TX', lat: 31.5493, lng: -97.1467 };

const mini = {
  home: HOME,
  trips: [
    { id: 'swing', label: 'Two-Stop Swing', travelMode: 'flight', stops: ['Alpha, FL', 'Beta, FL'] },
  ],
  games: [
    { date: 'Mar 10', opponent: 'A', location: 'Alpha, FL', lat: 29.0, lng: -81.3, home: false, conference: false, tripId: 'swing' },
    { date: 'Mar 12', opponent: 'B', location: 'Beta, FL', lat: 28.6, lng: -81.2, home: false, conference: true, tripId: 'swing' },
    { date: 'Feb 1', opponent: 'C', location: 'Waco, TX', lat: 31.5493, lng: -97.1467, home: true, conference: false, tripId: null },
    { date: 'Feb 20', opponent: 'D', location: 'Solo, AZ', lat: 32.2, lng: -110.9, home: false, conference: true, tripId: null, travelMode: 'flight' },
  ],
};

describe('buildTimeline', () => {
  it('orders scenes chronologically and excludes home games', () => {
    const scenes = buildTimeline(mini);
    expect(scenes.map(s => s.label)).toEqual(['Solo, AZ', 'Two-Stop Swing']);
  });

  it('chains multi-stop trip legs home → stops → home', () => {
    const scenes = buildTimeline(mini);
    const swing = scenes.find(s => s.label === 'Two-Stop Swing');
    expect(swing.legs).toHaveLength(3);
    expect(swing.legs[0].from.lat).toBe(HOME.lat);
    expect(swing.legs[1].from.lng).toBe(-81.3);
    expect(swing.legs[2].to.lat).toBe(HOME.lat);
    expect(swing.games.map(g => g.opponent)).toEqual(['A', 'B']);
  });

  it('single destination gets a round trip', () => {
    const scenes = buildTimeline(mini);
    const solo = scenes.find(s => s.label === 'Solo, AZ');
    expect(solo.legs).toHaveLength(2);
    expect(solo.tripMiles).toBeCloseTo(solo.legs[0].miles * 2, 5);
    expect(solo.timezone).toBe('Mountain');
    expect(solo.travelMode).toBe('flight');
  });

  it('flags conference if any game in the trip is conference', () => {
    const scenes = buildTimeline(mini);
    expect(scenes.find(s => s.label === 'Two-Stop Swing').conference).toBe(true);
  });

  it('cumulative mileage matches calcTotalMiles exactly (softball 2026)', () => {
    const scenes = buildTimeline(softball);
    const awayDests = groupByDest(softball.games).filter(d => !d.home);
    const expected = calcTotalMiles(awayDests, softball.trips, softball.home);
    expect(scenes[scenes.length - 1].cumulativeMiles).toBeCloseTo(expected, 6);
  });

  it('softball 2026 produces 12 scenes with Florida swing as one', () => {
    const scenes = buildTimeline(softball);
    expect(scenes).toHaveLength(12);
    const swing = scenes.find(s => s.label === 'Florida Swing');
    expect(swing.legs).toHaveLength(3);
    expect(swing.games).toHaveLength(4);
    // Two separate Austin trips (March series + May regional)
    expect(scenes.filter(s => s.stops[0].location === 'Austin, TX')).toHaveLength(2);
  });
});
