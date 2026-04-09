export function groupByDest(games) {
  const map = {};
  games.forEach(g => {
    const key = `${g.lat},${g.lng}`;
    if (!map[key]) {
      map[key] = {
        location: g.location,
        lat: g.lat,
        lng: g.lng,
        home: g.home,
        tripId: g.tripId || null,
        games: [],
      };
    }
    map[key].games.push(g);
    if (g.tripId) map[key].tripId = g.tripId;
  });
  return Object.values(map);
}
