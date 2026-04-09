import { haversine } from './haversine.js';

export function calcTotalMiles(awayDests, trips, home) {
  let total = 0;
  const tripsProcessed = new Set();

  awayDests.forEach(d => {
    if (d.tripId && !tripsProcessed.has(d.tripId)) {
      const trip = trips.find(t => t.id === d.tripId);
      if (trip) {
        tripsProcessed.add(d.tripId);
        const stops = trip.stops
          .map(loc => awayDests.find(dd => dd.location === loc))
          .filter(Boolean);
        if (stops.length > 0) {
          total += haversine(home.lat, home.lng, stops[0].lat, stops[0].lng);
          for (let i = 0; i < stops.length - 1; i++) {
            total += haversine(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
          }
          total += haversine(stops[stops.length - 1].lat, stops[stops.length - 1].lng, home.lat, home.lng);
        }
      } else {
        // Trip not found in registry; treat as a normal round trip
        total += haversine(home.lat, home.lng, d.lat, d.lng) * 2;
      }
    } else if (!d.tripId) {
      // Non-trip destination
      total += haversine(home.lat, home.lng, d.lat, d.lng) * 2;
    }
    // If d.tripId and already in tripsProcessed, skip (it was part of a multi-stop trip)
  });

  return total;
}
