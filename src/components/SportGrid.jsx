import { useMemo, useState } from 'react';
import { sports } from '../data/index.js';
import { groupByDest } from '../utils/groupByDest.js';
import { calcTotalMiles } from '../utils/calcMiles.js';
import { haversine } from '../utils/haversine.js';
import { computeTimezoneChanges } from '../utils/timezones.js';
import { loadImportedSports, removeImportedSport } from '../utils/importedSports.js';

function SportCard({ sport, onClick, imported, onRemove }) {
  const isActive = !sport.status;

  const stats = useMemo(() => {
    if (!isActive) return null;
    const allDests = groupByDest(sport.games);
    const awayDests = allDests.filter(d => !d.home);
    const totalMiles = calcTotalMiles(awayDests, sport.trips || [], sport.home);
    const awayTrips = (() => {
      const seen = new Set();
      // Coords, not location string — two trips to the same city count separately
      awayDests.forEach(d => { if (d.tripId) seen.add(d.tripId); else seen.add(`${d.lat},${d.lng}`); });
      return seen.size;
    })();
    const tzChanges = computeTimezoneChanges(allDests, sport.trips || [], sport.home);
    const totalCrossings = Object.values(tzChanges).reduce((s, d) => s + d.length, 0);
    return { totalMiles, awayTrips, totalCrossings };
  }, [sport, isActive]);

  return (
    <div
      onClick={isActive ? onClick : undefined}
      style={{
        background: isActive ? '#ffffff' : '#f8fafc',
        border: `1px solid ${isActive ? '#e2e8f0' : '#f1f5f9'}`,
        borderRadius: 8,
        padding: 20,
        cursor: isActive ? 'pointer' : 'default',
        opacity: isActive ? 1 : 0.5,
        transition: 'border-color 0.15s, transform 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (isActive) e.currentTarget.style.borderColor = sport.colors?.conference || '#e2e8f0'; }}
      onMouseLeave={e => { if (isActive) e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      {/* Color accent bar */}
      {isActive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: sport.colors?.conference || '#FFB81C', borderRadius: '8px 8px 0 0' }} />
      )}

      <div style={{ marginTop: isActive ? 8 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: isActive ? '#0f172a' : '#94a3b8' }}>
              {sport.label}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sport.season}</div>
          </div>
          {!isActive && (
            <div style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              Coming Soon
            </div>
          )}
          {imported && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                Imported
              </div>
              <button
                onClick={e => { e.stopPropagation(); onRemove(); }}
                title="Remove from this browser"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 2 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {isActive && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Miles',    value: `${Math.round(stats.totalMiles / 1000 * 10) / 10}k` },
              { label: 'Trips',    value: stats.awayTrips },
              { label: 'TZ Cross', value: stats.totalCrossings },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: sport.colors?.conference || '#FFB81C' }}>
                  {value}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {isActive && sport.lastUpdated && (
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 12 }}>
            Updated {sport.lastUpdated}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SportGrid({ onSelect, onImport }) {
  const [imported, setImported] = useState(loadImportedSports);

  function handleRemove(sportId) {
    removeImportedSport(sportId);
    setImported(loadImportedSports());
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'DM Sans, sans-serif', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ background: '#154734', padding: '20px 32px' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Baylor Athletics</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Travel Demands by Sport</div>
      </div>

      {/* Grid */}
      <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {sports.map(sport => (
            <SportCard
              key={sport.sport}
              sport={sport}
              onClick={() => onSelect(sport)}
            />
          ))}
          {imported.map(sport => (
            <SportCard
              key={`imported-${sport.sport}`}
              sport={sport}
              imported
              onClick={() => onSelect(sport)}
              onRemove={() => handleRemove(sport.sport)}
            />
          ))}
          {/* Import entry card */}
          <div
            onClick={onImport}
            style={{
              border: '2px dashed #cbd5e1', borderRadius: 8, padding: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', minHeight: 120, color: '#94a3b8', background: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFB81C'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <div style={{ fontSize: 24, lineHeight: 1 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Import Schedule</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>from CSV</div>
          </div>
        </div>
      </div>
    </div>
  );
}
