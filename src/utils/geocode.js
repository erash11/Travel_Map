let dbPromise = null;

// Lazy-fetches the bundled city database (only the import page calls this,
// so the normal site never pays for it).
export function loadCityDb() {
  if (!dbPromise) {
    dbPromise = fetch(`${import.meta.env.BASE_URL}us-cities.json`).then(r => {
      if (!r.ok) throw new Error(`city database failed to load (${r.status})`);
      return r.json();
    });
  }
  return dbPromise;
}

// Returns a synchronous lookup: "City, ST" → { lat, lng } | null
export function makeGeocoder(db) {
  return location => {
    const m = location.match(/^(.+?),\s*([A-Za-z]{2})$/);
    if (!m) return null;
    const hit = db[`${m[1].trim().toLowerCase()}|${m[2].toUpperCase()}`];
    return hit ? { lat: hit[0], lng: hit[1] } : null;
  };
}
