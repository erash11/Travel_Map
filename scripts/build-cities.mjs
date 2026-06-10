// Generates public/us-cities.json — compact "city|ST" → [lat, lng] lookup used by
// the schedule importer. Source: GeoNames cities5000 (CC BY 4.0, geonames.org) —
// US cities with population ≥ 5,000; duplicates resolved by highest population.
// Run: node scripts/build-cities.mjs   (needs curl + tar, both ship with Windows 10+)
import { readFileSync, writeFileSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const ZIP = join(tmpdir(), 'cities5000.zip');
const TXT = join(tmpdir(), 'cities5000.txt');

execSync(`curl -sL -o "${ZIP}" https://download.geonames.org/export/dump/cities5000.zip`);
execSync(`tar -xf "${ZIP}" -C "${tmpdir()}"`);

// GeoNames tab-separated fields:
// 0 id, 1 name, 2 asciiname, 3 altnames, 4 lat, 5 lng, 6 featClass, 7 featCode,
// 8 country, 9 cc2, 10 admin1 (US state code), ... 14 population
const lookup = {};
const pop = {};
let count = 0;
for (const line of readFileSync(TXT, 'utf8').split('\n')) {
  const f = line.split('\t');
  if (f.length < 15 || f[8] !== 'US') continue;
  const key = `${f[2].trim().toLowerCase()}|${f[10].trim().toUpperCase()}`;
  const p = Number(f[14]) || 0;
  if (lookup[key] && pop[key] >= p) continue; // keep most-populous on duplicates
  if (!lookup[key]) count++;
  lookup[key] = [Math.round(Number(f[4]) * 1e4) / 1e4, Math.round(Number(f[5]) * 1e4) / 1e4];
  pop[key] = p;
}

writeFileSync('public/us-cities.json', JSON.stringify(lookup));
rmSync(ZIP, { force: true });
rmSync(TXT, { force: true });
console.log(`wrote public/us-cities.json with ${count} cities`);
