import { parseDateAsDayOfYear } from './parseDate.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// Cumulative days before each month (non-leap year, 0-indexed by month 0=Jan)
const MONTH_OFFSETS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

// Detects windows of windowDays days containing >= minGames games.
// Returns an array of period objects: { startDoy, endDoy, games, gameCount }.
// Once a game is part of a flagged period, it does not seed a new period.
export function detectCongestion(games, { games: minGames, windowDays }) {
  const dated = games
    .map(g => ({ ...g, doy: parseDateAsDayOfYear(g.date) }))
    .sort((a, b) => a.doy - b.doy);

  const covered = new Set();
  const periods = [];

  for (let i = 0; i < dated.length; i++) {
    if (covered.has(i)) continue;
    const windowEnd = dated[i].doy + windowDays - 1;

    const inWindow = dated.reduce((acc, g, j) => {
      if (g.doy >= dated[i].doy && g.doy <= windowEnd) acc.push({ game: g, idx: j });
      return acc;
    }, []);

    if (inWindow.length >= minGames) {
      inWindow.forEach(({ idx }) => covered.add(idx));
      periods.push({
        startDoy: dated[i].doy,
        endDoy: windowEnd,
        games: inWindow.map(({ game }) => game),
        gameCount: inWindow.length,
      });
    }
  }

  return periods;
}

// Converts a day-of-year number back to a display string like "Mar 6"
export function dayOfYearToDisplay(doy) {
  let m = 0;
  while (m < 11 && MONTH_OFFSETS[m + 1] < doy) m++;
  const day = doy - MONTH_OFFSETS[m];
  return `${MONTHS[m]} ${day}`;
}
