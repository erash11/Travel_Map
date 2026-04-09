import { describe, it, expect } from 'vitest';
import { getDestinationTimezone, computeTimezoneChanges } from '../timezones.js';

describe('getDestinationTimezone', () => {
  it('returns Central for Waco, TX', () => {
    expect(getDestinationTimezone('Waco, TX')).toBe('Central');
  });
  it('returns Pacific for San Diego, CA', () => {
    expect(getDestinationTimezone('San Diego, CA')).toBe('Pacific');
  });
  it('returns Eastern for Clemson, SC', () => {
    expect(getDestinationTimezone('Clemson, SC')).toBe('Eastern');
  });
  it('returns Mountain for Tucson, AZ', () => {
    expect(getDestinationTimezone('Tucson, AZ')).toBe('Mountain');
  });
  it('defaults to Central for unrecognized location', () => {
    expect(getDestinationTimezone('Unknown Place')).toBe('Central');
  });
});

describe('computeTimezoneChanges', () => {
  const HOME = { city: 'Waco, TX' };
  const dests = [
    { location: 'Waco, TX', home: true, tripId: null },
    { location: 'San Diego, CA', home: false, tripId: null },
    { location: 'Clemson, SC', home: false, tripId: null },
    { location: 'DeLand, FL', home: false, tripId: 'florida-swing' },
    { location: 'Orlando, FL', home: false, tripId: 'florida-swing' },
    { location: 'Lubbock, TX', home: false, tripId: null },
  ];

  it('excludes home destinations', () => {
    const changes = computeTimezoneChanges(dests, [], HOME);
    expect(Object.values(changes).flat().every(d => !d.home)).toBe(true);
  });

  it('excludes destinations in the same zone as home', () => {
    const changes = computeTimezoneChanges(dests, [], HOME);
    expect(changes['Central']).toBeUndefined();
  });

  it('groups crossing destinations by zone', () => {
    const changes = computeTimezoneChanges(dests, [], HOME);
    expect(changes['Pacific']).toHaveLength(1);
    expect(changes['Eastern']).toHaveLength(3); // Clemson, DeLand, Orlando
  });

  it('counts each zone once per multi-stop trip', () => {
    const trips = [{ id: 'florida-swing', stops: ['DeLand, FL', 'Orlando, FL'] }];
    const changes = computeTimezoneChanges(dests, trips, HOME);
    // DeLand and Orlando are both Eastern — should only count once for the trip
    expect(changes['Eastern']).toHaveLength(2); // Clemson (no trip) + once for the swing trip
  });
});
