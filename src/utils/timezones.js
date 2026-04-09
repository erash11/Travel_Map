// Maps 2-letter state abbreviation → time zone name
const STATE_ABBR_TIMEZONES = {
  AL: 'Central',  AK: 'Alaska',   AZ: 'Mountain', AR: 'Central',  CA: 'Pacific',
  CO: 'Mountain', CT: 'Eastern',  DE: 'Eastern',  FL: 'Eastern',  GA: 'Eastern',
  HI: 'Hawaii',   ID: 'Mountain', IL: 'Central',  IN: 'Eastern',  IA: 'Central',
  KS: 'Central',  KY: 'Eastern',  LA: 'Central',  ME: 'Eastern',  MD: 'Eastern',
  MA: 'Eastern',  MI: 'Eastern',  MN: 'Central',  MS: 'Central',  MO: 'Central',
  MT: 'Mountain', NE: 'Central',  NV: 'Pacific',  NH: 'Eastern',  NJ: 'Eastern',
  NM: 'Mountain', NY: 'Eastern',  NC: 'Eastern',  ND: 'Central',  OH: 'Eastern',
  OK: 'Central',  OR: 'Pacific',  PA: 'Eastern',  RI: 'Eastern',  SC: 'Eastern',
  SD: 'Central',  TN: 'Central',  TX: 'Central',  UT: 'Mountain', VT: 'Eastern',
  VA: 'Eastern',  WA: 'Pacific',  WV: 'Eastern',  WI: 'Central',  WY: 'Mountain',
  DC: 'Eastern',
};

// Maps FIPS code (zero-padded 2-digit string) → time zone name.
// Used to color state SVG paths by time zone.
export const FIPS_TIMEZONES = {
  '01': 'Central',   // Alabama
  '02': 'Alaska',    // Alaska
  '04': 'Mountain',  // Arizona
  '05': 'Central',   // Arkansas
  '06': 'Pacific',   // California
  '08': 'Mountain',  // Colorado
  '09': 'Eastern',   // Connecticut
  '10': 'Eastern',   // Delaware
  '11': 'Eastern',   // DC
  '12': 'Eastern',   // Florida
  '13': 'Eastern',   // Georgia
  '15': 'Hawaii',    // Hawaii
  '16': 'Mountain',  // Idaho
  '17': 'Central',   // Illinois
  '18': 'Eastern',   // Indiana
  '19': 'Central',   // Iowa
  '20': 'Central',   // Kansas
  '21': 'Eastern',   // Kentucky
  '22': 'Central',   // Louisiana
  '23': 'Eastern',   // Maine
  '24': 'Eastern',   // Maryland
  '25': 'Eastern',   // Massachusetts
  '26': 'Eastern',   // Michigan
  '27': 'Central',   // Minnesota
  '28': 'Central',   // Mississippi
  '29': 'Central',   // Missouri
  '30': 'Mountain',  // Montana
  '31': 'Central',   // Nebraska
  '32': 'Pacific',   // Nevada
  '33': 'Eastern',   // New Hampshire
  '34': 'Eastern',   // New Jersey
  '35': 'Mountain',  // New Mexico
  '36': 'Eastern',   // New York
  '37': 'Eastern',   // North Carolina
  '38': 'Central',   // North Dakota
  '39': 'Eastern',   // Ohio
  '40': 'Central',   // Oklahoma
  '41': 'Pacific',   // Oregon
  '42': 'Eastern',   // Pennsylvania
  '44': 'Eastern',   // Rhode Island
  '45': 'Eastern',   // South Carolina
  '46': 'Central',   // South Dakota
  '47': 'Central',   // Tennessee
  '48': 'Central',   // Texas
  '49': 'Mountain',  // Utah
  '50': 'Eastern',   // Vermont
  '51': 'Eastern',   // Virginia
  '53': 'Pacific',   // Washington
  '54': 'Eastern',   // West Virginia
  '55': 'Central',   // Wisconsin
  '56': 'Mountain',  // Wyoming
};

// rgba fill colors for SVG state tints — applied over the dark base fill
export const TZ_FILL_COLORS = {
  Pacific:  'rgba(99, 179, 237, 0.18)',
  Mountain: 'rgba(154, 230, 180, 0.18)',
  Central:  'rgba(252, 211, 77, 0.15)',
  Eastern:  'rgba(245, 101, 101, 0.18)',
};

// Colors for floating zone label text
export const TZ_LABEL_COLORS = {
  Pacific:  'rgba(99, 179, 237, 0.70)',
  Mountain: 'rgba(154, 230, 180, 0.70)',
  Central:  'rgba(252, 211, 77, 0.70)',
  Eastern:  'rgba(245, 101, 101, 0.70)',
};

// Short display abbreviations
export const TZ_ABBR = {
  Pacific: 'PT', Mountain: 'MT', Central: 'CT', Eastern: 'ET',
};

// Derives time zone from a location string like "San Diego, CA"
export function getDestinationTimezone(location) {
  const match = location.match(/,\s*([A-Z]{2})$/);
  if (!match) return 'Central';
  return STATE_ABBR_TIMEZONES[match[1]] || 'Central';
}

// Returns a map of { zone: [destination, ...] } for away destinations
// that cross a time zone boundary from the home city.
// Multi-stop trips that visit multiple destinations in the same foreign zone
// are counted only once for that zone.
export function computeTimezoneChanges(destinations, trips, home) {
  const homeZone = getDestinationTimezone(home.city);
  const changes = {};
  const tripZonesSeen = {};
  const hasTripDefs = trips && trips.length > 0;

  destinations
    .filter(d => !d.home)
    .forEach(dest => {
      const zone = getDestinationTimezone(dest.location);
      if (zone === homeZone) return;

      if (hasTripDefs && dest.tripId) {
        if (!tripZonesSeen[dest.tripId]) tripZonesSeen[dest.tripId] = new Set();
        if (tripZonesSeen[dest.tripId].has(zone)) return;
        tripZonesSeen[dest.tripId].add(zone);
      }

      if (!changes[zone]) changes[zone] = [];
      changes[zone].push(dest);
    });

  return changes;
}
