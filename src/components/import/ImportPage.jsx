import { useState, useMemo, useEffect, useRef } from 'react';
import { parseCsv } from '../../utils/parseCsv.js';
import { csvToSport, BAYLOR_DEFAULTS } from '../../utils/csvToSport.js';
import { loadCityDb, makeGeocoder } from '../../utils/geocode.js';
import { calcTotalMiles } from '../../utils/calcMiles.js';
import { groupByDest } from '../../utils/groupByDest.js';
import { saveImportedSport } from '../../utils/importedSports.js';

const TEMPLATE_CSV = `date,opponent,location,home,conference,result,tournament,tripId,travelMode,lat,lng
Feb 5,Mississippi State,"Waco, TX",TRUE,FALSE,W 6-3,Season Opener,,,,
Feb 12,San Diego State,"San Diego, CA",FALSE,FALSE,,Campbell Classic,,flight,,
Mar 11,Stetson,"DeLand, FL",FALSE,FALSE,,,florida-swing,flight,,
Mar 13,UCF,"Orlando, FL",FALSE,TRUE,,,florida-swing,flight,,
`;

const inputStyle = {
  border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px',
  fontSize: 13, color: '#0f172a', background: '#fff', width: '100%',
  fontFamily: 'inherit', boxSizing: 'border-box',
};
const labelStyle = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' };

// Eric-only tool: CSV → validated sport object → save to browser / download JSON.
export default function ImportPage({ onBack, onView }) {
  const [meta, setMeta] = useState({
    sport: '', label: '', season: String(new Date().getFullYear()),
    homeCity: BAYLOR_DEFAULTS.home.city,
    homeLat: BAYLOR_DEFAULTS.home.lat, homeLng: BAYLOR_DEFAULTS.home.lng,
  });
  const [csvText, setCsvText] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [cityDb, setCityDb] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [overrides, setOverrides] = useState({}); // location → {lat, lng} manual fixes
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    loadCityDb().then(setCityDb).catch(e => setDbError(e.message));
  }, []);

  const result = useMemo(() => {
    if (!csvText || !cityDb) return null;
    const { rows } = parseCsv(csvText);
    const base = makeGeocoder(cityDb);
    const geocode = loc => {
      const o = overrides[loc];
      if (o && isFinite(Number(o.lat)) && isFinite(Number(o.lng)) && o.lat !== '' && o.lng !== '') {
        return { lat: Number(o.lat), lng: Number(o.lng) };
      }
      return base(loc);
    };
    return csvToSport(rows, {
      sport: meta.sport.trim().toLowerCase().replace(/\s+/g, '-'),
      label: meta.label.trim(),
      season: meta.season.trim(),
      lastUpdated: new Date().toISOString().slice(0, 10),
      home: { city: meta.homeCity.trim(), lat: Number(meta.homeLat), lng: Number(meta.homeLng) },
    }, geocode);
  }, [csvText, cityDb, meta, overrides]);

  const metaProblems = useMemo(() => {
    const p = [];
    if (csvText) {
      if (!meta.sport.trim()) p.push('Sport ID is required (e.g. "soccer")');
      if (!meta.label.trim()) p.push('Display label is required (e.g. "Soccer")');
      if (!isFinite(Number(meta.homeLat)) || !isFinite(Number(meta.homeLng))) p.push('Home coordinates are invalid');
    }
    return p;
  }, [meta, csvText]);

  const unknownCities = useMemo(() => {
    if (!result) return [];
    const seen = new Set();
    return result.errors
      .filter(e => e.message.startsWith('unknown city'))
      .map(e => e.message.match(/unknown city "([^"]+)"/)?.[1])
      .filter(c => c && !seen.has(c) && seen.add(c));
  }, [result]);

  const stats = useMemo(() => {
    if (!result || result.errors.length || metaProblems.length) return null;
    const dests = groupByDest(result.sport.games).filter(d => !d.home);
    return {
      games: result.sport.games.length,
      trips: result.sport.trips.length,
      miles: Math.round(calcTotalMiles(dests, result.sport.trips, result.sport.home)),
    };
  }, [result, metaProblems]);

  function handleFile(file) {
    setFileName(file.name);
    setOverrides({});
    file.text().then(setCsvText);
  }

  function handleHomeCityBlur() {
    if (!cityDb) return;
    const hit = makeGeocoder(cityDb)(meta.homeCity.trim());
    if (hit) setMeta(m => ({ ...m, homeLat: hit.lat, homeLng: hit.lng }));
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveAndView() {
    const ok = saveImportedSport(result.sport);
    if (!ok) alert('Could not save to browser storage — you can still Download JSON.');
    onView(result.sport);
  }

  const ready = result && result.errors.length === 0 && metaProblems.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'DM Sans, sans-serif', color: '#0f172a' }}>
      <div style={{ background: '#154734', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>
          ← All Sports
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Import Schedule</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>CSV → travel map</div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
        {/* Sport metadata */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Sport details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Sport ID</label>
              <input style={inputStyle} placeholder="soccer" value={meta.sport} onChange={e => setMeta(m => ({ ...m, sport: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Display label</label>
              <input style={inputStyle} placeholder="Soccer" value={meta.label} onChange={e => setMeta(m => ({ ...m, label: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Season</label>
              <input style={inputStyle} value={meta.season} onChange={e => setMeta(m => ({ ...m, season: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Home city</label>
              <input style={inputStyle} value={meta.homeCity} onBlur={handleHomeCityBlur} onChange={e => setMeta(m => ({ ...m, homeCity: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Home lat</label>
              <input style={inputStyle} value={meta.homeLat} onChange={e => setMeta(m => ({ ...m, homeLat: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Home lng</label>
              <input style={inputStyle} value={meta.homeLng} onChange={e => setMeta(m => ({ ...m, homeLng: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#FFB81C' : '#cbd5e1'}`,
            background: dragging ? '#fffbeb' : '#fff',
            borderRadius: 8, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 16,
          }}
        >
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {fileName ? `📄 ${fileName}` : 'Drop a schedule CSV here, or click to choose'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
            Required columns: date, opponent, location, home ·{' '}
            <a
              href="#template"
              onClick={e => { e.preventDefault(); e.stopPropagation(); download('schedule-template.csv', TEMPLATE_CSV, 'text/csv'); }}
              style={{ color: '#2563eb' }}
            >
              download template
            </a>
          </div>
          {dbError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>City database failed to load: {dbError}</div>}
          {!cityDb && !dbError && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Loading city database…</div>}
        </div>

        {/* Metadata problems */}
        {csvText && metaProblems.length > 0 && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            {metaProblems.map(p => <div key={p} style={{ fontSize: 13, color: '#c2410c' }}>• {p}</div>)}
          </div>
        )}

        {/* Validation report */}
        {result && result.errors.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#dc2626', marginBottom: 8 }}>
              {result.errors.length} problem{result.errors.length > 1 ? 's' : ''} to fix
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {result.errors.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: '#0f172a', padding: '2px 0' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>row {e.row}</span> — {e.message}
                </div>
              ))}
            </div>

            {unknownCities.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Fix unknown cities (enter coordinates):</div>
                {unknownCities.map(city => (
                  <div key={city} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <div style={{ fontSize: 13 }}>{city}</div>
                    <input style={inputStyle} placeholder="lat" value={overrides[city]?.lat || ''}
                      onChange={e => setOverrides(o => ({ ...o, [city]: { ...o[city], lat: e.target.value } }))} />
                    <input style={inputStyle} placeholder="lng" value={overrides[city]?.lng || ''}
                      onChange={e => setOverrides(o => ({ ...o, [city]: { ...o[city], lng: e.target.value } }))} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {result && result.warnings.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            {result.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 12, color: '#92400e' }}>row {w.row} — {w.message}</div>
            ))}
          </div>
        )}

        {/* Success summary + actions */}
        {ready && (
          <div style={{ background: '#fff', border: '1px solid #86efac', borderRadius: 8, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#16a34a', marginBottom: 10 }}>
              ✓ Ready — {stats.games} games · {stats.trips} multi-stop trip{stats.trips === 1 ? '' : 's'} · {stats.miles.toLocaleString()} season miles
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveAndView} style={{ background: '#154734', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                Save & View on Map
              </button>
              <button
                onClick={() => download(`${result.sport.sport}.json`, JSON.stringify(result.sport, null, 2), 'application/json')}
                style={{ background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 6, padding: '9px 16px', cursor: 'pointer', fontSize: 13 }}
              >
                Download JSON
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
              "Save" keeps it in this browser only. To publish for everyone: Download JSON → drop in <code>src/data/</code> → register in <code>src/data/index.js</code> → push.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
