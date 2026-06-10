import softball from './softball.json';
import football2025 from './football-2025.json';
import football2026 from './football-2026.json';
import volleyball2025 from './volleyball-2025.json';
import volleyball2026Spring from './volleyball-2026-spring.json';

// Active sports have a full data object imported above.
// Coming-soon entries are stubs — SportGrid renders them as muted cards.
export const sports = [
  softball,
  football2025,
  football2026,
  volleyball2025,
  volleyball2026Spring,
  { sport: 'baseball',    label: 'Baseball',    season: '2026', status: 'coming-soon' },
  { sport: 'soccer',      label: 'Soccer',      season: '2026', status: 'coming-soon' },
  { sport: 'basketball',  label: 'Basketball',  season: '2026', status: 'coming-soon' },
];
