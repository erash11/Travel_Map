import { describe, it, expect } from 'vitest';
import { parseCsv } from '../parseCsv.js';

describe('parseCsv', () => {
  it('parses simple rows with lowercase header keys', () => {
    const { headers, rows } = parseCsv('Date,Opponent\nFeb 5,Texas\nFeb 6,Kansas');
    expect(headers).toEqual(['date', 'opponent']);
    expect(rows).toEqual([
      { date: 'Feb 5', opponent: 'Texas' },
      { date: 'Feb 6', opponent: 'Kansas' },
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const { rows } = parseCsv('date,location\nFeb 5,"Waco, TX"');
    expect(rows[0].location).toBe('Waco, TX');
  });

  it('handles escaped quotes and newlines inside quotes', () => {
    const { rows } = parseCsv('a,b\n"say ""hi""","line1\nline2"');
    expect(rows[0].a).toBe('say "hi"');
    expect(rows[0].b).toBe('line1\nline2');
  });

  it('handles CRLF line endings and skips blank lines', () => {
    const { rows } = parseCsv('a,b\r\n1,2\r\n\r\n3,4\r\n');
    expect(rows).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }]);
  });

  it('fills missing trailing fields with empty strings', () => {
    const { rows } = parseCsv('a,b,c\n1,2');
    expect(rows[0]).toEqual({ a: '1', b: '2', c: '' });
  });

  it('returns empty for empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });
});
