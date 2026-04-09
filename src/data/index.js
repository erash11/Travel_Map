import softball from './softball.json';

// Active sports have a full data object imported above.
// Coming-soon entries are stubs — SportGrid renders them as muted cards.
export const sports = [
  softball,
  { sport: 'baseball',    label: 'Baseball',    season: '2026', status: 'coming-soon' },
  { sport: 'soccer',      label: 'Soccer',      season: '2026', status: 'coming-soon' },
  { sport: 'basketball',  label: 'Basketball',  season: '2026', status: 'coming-soon' },
  { sport: 'football',    label: 'Football',    season: '2026', status: 'coming-soon' },
  { sport: 'volleyball',  label: 'Volleyball',  season: '2026', status: 'coming-soon' },
];
