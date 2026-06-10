import { parseDate } from './parseDate.js';

const TRAVEL_MODES = ['flight', 'bus', 'charter', 'tbd'];
const TRUE_VALUES = ['true', 'yes', 'y', '1'];
const FALSE_VALUES = ['false', 'no', 'n', '0', ''];

export const BAYLOR_DEFAULTS = {
  home: { city: 'Waco, TX', lat: 31.5493, lng: -97.1467 },
  colors: { conference: '#FFB81C', nonConference: '#4ecdc4' },
  congestionThreshold: { games: 5, windowDays: 7 },
};

// Converts parsed CSV rows + sport metadata into a sport object matching the
// schema in src/data/*.json. Pure: geocoding is injected as a lookup function
// (location string → {lat, lng} | null).
// Returns { sport, errors, warnings } — errors block import, warnings don't.
// Error/warning entries: { row, message } with 1-based CSV data row numbers.
export function csvToSport(rows, meta, geocode) {
  const errors = [];
  const warnings = [];
  const home = meta.home || BAYLOR_DEFAULTS.home;

  const games = [];
  rows.forEach((r, i) => {
    const row = i + 1;
    const problems = [];

    if (!r.date) problems.push('missing date');
    else if (parseDate(r.date) < 100) problems.push(`unrecognized date "${r.date}" (use e.g. "Feb 5")`);

    if (!r.opponent) problems.push('missing opponent');

    const isHome = parseBool(r.home);
    if (isHome === null) problems.push(`home must be true/false, got "${r.home}"`);

    const conference = parseBool(r.conference || 'false');
    if (conference === null) problems.push(`conference must be true/false, got "${r.conference}"`);

    let travelMode = (r.travelmode || '').toLowerCase() || null;
    if (travelMode && !TRAVEL_MODES.includes(travelMode)) {
      warnings.push({ row, message: `unknown travelMode "${r.travelmode}" — treated as tbd` });
      travelMode = 'tbd';
    }

    if (r.result && !/^[WLT]\s/.test(r.result)) {
      warnings.push({ row, message: `result "${r.result}" doesn't look like "W 6-3" — kept as-is` });
    }

    // Location: blank allowed for home games (defaults to home city)
    let location = r.location;
    let lat = parseNum(r.lat);
    let lng = parseNum(r.lng);
    if (!location) {
      if (isHome) {
        location = home.city;
        lat = home.lat;
        lng = home.lng;
      } else {
        problems.push('away game needs a location');
      }
    }
    if (location && (lat === null || lng === null)) {
      if (isHome && location === home.city) {
        lat = home.lat; lng = home.lng;
      } else {
        const hit = geocode(location);
        if (hit) { lat = hit.lat; lng = hit.lng; }
        else problems.push(`unknown city "${location}" — fix the spelling or add lat/lng columns`);
      }
    }

    if (problems.length) {
      problems.forEach(message => errors.push({ row, message }));
      return;
    }

    games.push({
      date: r.date,
      opponent: r.opponent,
      location,
      lat,
      lng,
      home: isHome,
      result: r.result || null,
      conference,
      ...(r.tournament ? { tournament: r.tournament } : {}),
      tripId: r.tripid || null,
      travelMode: isHome ? null : travelMode,
    });
  });

  if (games.length === 0 && errors.length === 0) {
    errors.push({ row: 0, message: 'no game rows found in the CSV' });
  }

  // Derive trips registry from tripId groups (stops in date order)
  const tripGames = new Map();
  games.forEach(g => {
    if (!g.tripId || g.home) return;
    if (!tripGames.has(g.tripId)) tripGames.set(g.tripId, []);
    tripGames.get(g.tripId).push(g);
  });
  const trips = [...tripGames.entries()].map(([id, gs]) => {
    const sorted = [...gs].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const stops = [...new Set(sorted.map(g => g.location))];
    return {
      id,
      label: meta.tripLabels?.[id] || defaultTripLabel(id),
      travelMode: sorted.find(g => g.travelMode)?.travelMode || 'tbd',
      stops,
    };
  });

  const sport = {
    sport: meta.sport,
    label: meta.label,
    season: meta.season,
    lastUpdated: meta.lastUpdated,
    home,
    colors: meta.colors || BAYLOR_DEFAULTS.colors,
    congestionThreshold: meta.congestionThreshold || BAYLOR_DEFAULTS.congestionThreshold,
    trips,
    games,
  };

  return { sport, errors, warnings };
}

function parseBool(value) {
  const v = (value ?? '').toLowerCase().trim();
  if (TRUE_VALUES.includes(v)) return true;
  if (FALSE_VALUES.includes(v)) return false;
  return null;
}

function parseNum(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}

// "florida-swing" → "Florida Swing"
function defaultTripLabel(id) {
  return id.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
