import { describe, it, expect } from 'vitest';
import { detectCongestion, dayOfYearToDisplay } from '../congestion.js';

// 7 games in 7 days (Mar 6-12) — should flag with threshold {games:5, windowDays:7}
const DENSE_GAMES = [
  { date: 'Mar 6',  opponent: 'Iowa State', location: 'Waco, TX',  home: true },
  { date: 'Mar 6',  opponent: 'Iowa State', location: 'Waco, TX',  home: true },
  { date: 'Mar 7',  opponent: 'Iowa State', location: 'Waco, TX',  home: true },
  { date: 'Mar 9',  opponent: 'Stetson',   location: 'DeLand, FL', home: false },
  { date: 'Mar 10', opponent: 'UCF',       location: 'Orlando, FL',home: false },
  { date: 'Mar 11', opponent: 'UCF',       location: 'Orlando, FL',home: false },
  { date: 'Mar 12', opponent: 'UCF',       location: 'Orlando, FL',home: false },
];

// 2 games in 10 days — should not flag
const SPARSE_GAMES = [
  { date: 'Feb 5',  opponent: 'A', location: 'Waco, TX', home: true },
  { date: 'Feb 25', opponent: 'B', location: 'Huntsville, TX', home: false },
];

describe('detectCongestion', () => {
  const threshold = { games: 5, windowDays: 7 };

  it('returns empty array when no congestion', () => {
    expect(detectCongestion(SPARSE_GAMES, threshold)).toHaveLength(0);
  });

  it('flags a dense game cluster', () => {
    const periods = detectCongestion(DENSE_GAMES, threshold);
    expect(periods.length).toBeGreaterThan(0);
  });

  it('flagged period contains game count >= threshold', () => {
    const periods = detectCongestion(DENSE_GAMES, threshold);
    expect(periods[0].gameCount).toBeGreaterThanOrEqual(5);
  });

  it('flagged period has startDoy and endDoy', () => {
    const periods = detectCongestion(DENSE_GAMES, threshold);
    expect(periods[0]).toHaveProperty('startDoy');
    expect(periods[0]).toHaveProperty('endDoy');
    expect(periods[0].endDoy).toBeGreaterThan(periods[0].startDoy);
  });
});

describe('dayOfYearToDisplay', () => {
  it('converts doy 1 to "Jan 1"', () => {
    expect(dayOfYearToDisplay(1)).toBe('Jan 1');
  });
  it('converts doy 32 to "Feb 1"', () => {
    expect(dayOfYearToDisplay(32)).toBe('Feb 1');
  });
  it('converts doy 60 to "Mar 1"', () => {
    expect(dayOfYearToDisplay(60)).toBe('Mar 1');
  });
});
