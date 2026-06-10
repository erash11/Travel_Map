import { describe, it, expect } from 'vitest';
import { parseCsv } from '../parseCsv.js';
import { csvToSport, BAYLOR_DEFAULTS } from '../csvToSport.js';
import softball from '../../data/softball.json';

const META = {
  sport: 'testsport',
  label: 'Test Sport',
  season: '2027',
  lastUpdated: '2026-06-10',
};

// Geocoder stub: knows two cities
const geo = loc => ({
  'Austin, TX': { lat: 30.2672, lng: -97.7431 },
  'Tulsa, OK': { lat: 36.154, lng: -95.9928 },
}[loc] || null);

describe('csvToSport', () => {
  it('converts a valid CSV to the sport schema with defaults', () => {
    const { rows } = parseCsv(
      'date,opponent,location,home,conference,result\n' +
      'Feb 5,Texas,"Austin, TX",false,true,W 6-3\n' +
      'Feb 8,Kansas,,true,false,'
    );
    const { sport, errors, warnings } = csvToSport(rows, META, geo);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(sport.home).toEqual(BAYLOR_DEFAULTS.home);
    expect(sport.colors).toEqual(BAYLOR_DEFAULTS.colors);
    expect(sport.games[0]).toMatchObject({
      date: 'Feb 5', opponent: 'Texas', location: 'Austin, TX',
      lat: 30.2672, lng: -97.7431, home: false, conference: true, result: 'W 6-3',
    });
    // blank location on home game → home city + coords, null result
    expect(sport.games[1]).toMatchObject({
      location: 'Waco, TX', lat: 31.5493, lng: -97.1467, home: true, result: null,
    });
  });

  it('reports row-numbered errors for unknown city, bad date, bad home flag', () => {
    const { rows } = parseCsv(
      'date,opponent,location,home\n' +
      'Feb 5,A,"Nowhere, ZZ",false\n' +
      'NotADate,B,"Austin, TX",false\n' +
      'Feb 7,C,"Austin, TX",maybe'
    );
    const { errors } = csvToSport(rows, META, geo);
    expect(errors).toEqual([
      { row: 1, message: expect.stringContaining('unknown city "Nowhere, ZZ"') },
      { row: 2, message: expect.stringContaining('unrecognized date') },
      { row: 3, message: expect.stringContaining('home must be true/false') },
    ]);
  });

  it('lat/lng columns override the geocoder', () => {
    const { rows } = parseCsv(
      'date,opponent,location,home,lat,lng\n' +
      'Feb 5,A,"Tiny Town, MT",false,45.1,-110.2'
    );
    const { sport, errors } = csvToSport(rows, META, geo);
    expect(errors).toEqual([]);
    expect(sport.games[0]).toMatchObject({ lat: 45.1, lng: -110.2 });
  });

  it('derives multi-stop trips from tripId with stops in date order', () => {
    const { rows } = parseCsv(
      'date,opponent,location,home,tripid,travelmode\n' +
      'Mar 12,B,"Tulsa, OK",false,ok-swing,flight\n' +
      'Mar 10,A,"Austin, TX",false,ok-swing,flight'
    );
    const { sport, errors } = csvToSport(rows, META, geo);
    expect(errors).toEqual([]);
    expect(sport.trips).toEqual([
      { id: 'ok-swing', label: 'Ok Swing', travelMode: 'flight', stops: ['Austin, TX', 'Tulsa, OK'] },
    ]);
  });

  it('accepts yes/no/1/0 booleans and warns on odd values', () => {
    const { rows } = parseCsv(
      'date,opponent,location,home,travelmode,result\n' +
      'Feb 5,A,"Austin, TX",no,helicopter,6 to 3'
    );
    const { sport, errors, warnings } = csvToSport(rows, META, geo);
    expect(errors).toEqual([]);
    expect(sport.games[0].home).toBe(false);
    expect(sport.games[0].travelMode).toBe('tbd');
    expect(warnings).toHaveLength(2); // unknown travelMode + odd result format
  });

  it('errors on an empty CSV', () => {
    const { errors } = csvToSport([], META, geo);
    expect(errors[0].message).toContain('no game rows');
  });

  it('round-trips softball.json through CSV without drift (schema lock)', () => {
    // Serialize the real softball data to CSV exactly as the template defines it
    const esc = v => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const csv = [
      'date,opponent,location,home,conference,result,tournament,tripid,travelmode,lat,lng',
      ...softball.games.map(g => [
        g.date, g.opponent, g.location, g.home, g.conference, g.result,
        g.tournament, g.tripId, g.travelMode, g.lat, g.lng,
      ].map(esc).join(',')),
    ].join('\n');

    const meta = {
      sport: softball.sport,
      label: softball.label,
      season: softball.season,
      lastUpdated: softball.lastUpdated,
      home: softball.home,
      colors: softball.colors,
      congestionThreshold: softball.congestionThreshold,
      tripLabels: Object.fromEntries(softball.trips.map(t => [t.id, t.label])),
    };
    const { sport, errors } = csvToSport(parseCsv(csv).rows, meta, () => null);

    expect(errors).toEqual([]);
    expect(sport.games).toEqual(softball.games.map(g => ({
      ...g,
      // tournament key omitted entirely when absent (vs explicit undefined)
      ...(g.tournament ? {} : { tournament: undefined }),
    })).map(g => {
      const { tournament, ...rest } = g;
      return tournament === undefined ? rest : { ...rest, tournament };
    }));
    // Trips: stops and labels must match; travelMode lives at trip level in the
    // hand-authored JSON but per-game in CSV, so compare it separately
    expect(sport.trips.map(t => ({ id: t.id, label: t.label, stops: t.stops })))
      .toEqual(softball.trips.map(t => ({ id: t.id, label: t.label, stops: t.stops })));
    expect(sport.sport).toBe(softball.sport);
    expect(sport.home).toEqual(softball.home);
    expect(sport.colors).toEqual(softball.colors);
    expect(sport.congestionThreshold).toEqual(softball.congestionThreshold);
  });
});
