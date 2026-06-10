import { groupByDest } from './groupByDest.js';
import { haversine } from './haversine.js';
import { parseDate } from './parseDate.js';
import { getDestinationTimezone } from './timezones.js';

// Builds the cinematic tour: one scene per road trip, in season order.
// Multi-stop trips (tripId in the trips registry) become a single scene with
// chained legs; standalone destinations get home → dest → home legs.
// Leg math mirrors calcTotalMiles so the tour total always matches the map.
export function buildTimeline(sport) {
  const home = sport.home;
  const trips = sport.trips || [];
  const awayDests = groupByDest(sport.games).filter(d => !d.home);

  const scenes = [];
  const tripsProcessed = new Set();

  awayDests.forEach(dest => {
    const trip = dest.tripId ? trips.find(t => t.id === dest.tripId) : null;
    if (trip) {
      if (tripsProcessed.has(trip.id)) return;
      tripsProcessed.add(trip.id);
      const stops = trip.stops
        .map(loc => awayDests.find(d => d.location === loc))
        .filter(Boolean);
      if (stops.length > 0) scenes.push(makeScene(trip.label, stops, home, trip.travelMode));
    } else {
      scenes.push(makeScene(dest.location, [dest], home, dest.games[0]?.travelMode || null));
    }
  });

  scenes.sort((a, b) => a.sortKey - b.sortKey);

  let cumulative = 0;
  scenes.forEach((scene, i) => {
    cumulative += scene.tripMiles;
    scene.cumulativeMiles = cumulative;
    scene.index = i;
  });

  return scenes;
}

function makeScene(label, stops, home, travelMode) {
  const points = [home, ...stops, home];
  const legs = [];
  for (let i = 0; i < points.length - 1; i++) {
    legs.push({
      from: { lat: points[i].lat, lng: points[i].lng },
      to: { lat: points[i + 1].lat, lng: points[i + 1].lng },
      miles: haversine(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng),
    });
  }

  const games = stops
    .flatMap(s => s.games)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const dateRange = games.length > 1 && games[0].date !== games[games.length - 1].date
    ? `${games[0].date} – ${games[games.length - 1].date}`
    : games[0]?.date || '';

  const sortKey = Math.min(...games.map(g => parseDate(g.date)));
  return {
    id: `${label}@${sortKey}`, // label alone can repeat (two Austin trips)
    label,
    stops,
    legs,
    tripMiles: legs.reduce((sum, l) => sum + l.miles, 0),
    games,
    dateRange,
    sortKey,
    timezone: getDestinationTimezone(stops[0].location),
    conference: games.some(g => g.conference),
    tournament: games.find(g => g.tournament)?.tournament || null,
    travelMode,
  };
}
