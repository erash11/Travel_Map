const MONTH_NAMES = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

// Cumulative days before each month (non-leap year)
const MONTH_OFFSETS = [0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

// Returns month*100+day for game list sorting.
// Handles range strings like "Mar 7-8" by using the first date.
export function parseDate(dateStr) {
  const clean = dateStr.split(/\s*-\s*/)[0].trim();
  const parts = clean.split(' ');
  return (MONTH_NAMES[parts[0]] || 0) * 100 + (parseInt(parts[1]) || 0);
}

// Returns day-of-year (1–365) for congestion window arithmetic.
// Handles range strings like "Mar 7-8" by using the first date.
export function parseDateAsDayOfYear(dateStr) {
  const clean = dateStr.split(/\s*-\s*/)[0].trim();
  const [mon, day] = clean.split(' ');
  const month = MONTH_NAMES[mon] || 1;
  return MONTH_OFFSETS[month] + (parseInt(day) || 1);
}
