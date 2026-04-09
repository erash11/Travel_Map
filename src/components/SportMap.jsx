import { useState, useMemo } from 'react';
import USMap from './USMap.jsx';
import { groupByDest } from '../utils/groupByDest.js';
import { calcTotalMiles } from '../utils/calcMiles.js';
import { parseDate } from '../utils/parseDate.js';
import { haversine } from '../utils/haversine.js';

const FILTER_LABELS = ['All', 'Away', 'Home', 'Conference'];

export default function SportMap({ sport, onBack }) {
  const [filter, setFilter] = useState('All');
  const [selectedDest, setSelectedDest] = useState(null);
  const [hoveredDest, setHoveredDest] = useState(null);
  const [showTimezones, setShowTimezones] = useState(true);

  const home = sport.home;
  const trips = sport.trips || [];
  const colors = sport.colors;

  const allDests = useMemo(() => groupByDest(sport.games), [sport]);
  const awayDests = useMemo(() => allDests.filter(d => !d.home), [allDests]);

  const filteredGames = useMemo(() => {
    return sport.games.filter(g => {
      if (filter === 'Away') return !g.home;
      if (filter === 'Home') return g.home;
      if (filter === 'Conference') return g.conference;
      return true;
    });
  }, [sport.games, filter]);

  const destinations = useMemo(() => groupByDest(filteredGames), [filteredGames]);

  // Stats always from full unfiltered game list
  const totalMiles = useMemo(() => calcTotalMiles(awayDests, trips, home), [awayDests, trips, home]);
  const awayTrips = useMemo(() => {
    const seen = new Set();
    awayDests.forEach(d => {
      if (d.tripId) seen.add(d.tripId);
      else seen.add(d.location);
    });
    return seen.size;
  }, [awayDests]);
  const homeGames = useMemo(() => sport.games.filter(g => g.home).length, [sport]);
  const confGames = useMemo(() => sport.games.filter(g => g.conference).length, [sport]);

  const farthestDest = useMemo(() => {
    return awayDests.reduce((max, d) => {
      const mi = haversine(home.lat, home.lng, d.lat, d.lng);
      return mi > (max?.mi || 0) ? { ...d, mi } : max;
    }, null);
  }, [awayDests, home]);

  function handleSelect(dest) {
    setSelectedDest(prev => prev?.location === dest.location ? null : dest);
  }

  const sortedDests = useMemo(() => {
    return [...destinations].sort((a, b) => {
      const aDate = Math.min(...a.games.map(g => parseDate(g.date)));
      const bDate = Math.min(...b.games.map(g => parseDate(g.date)));
      return aDate - bDate;
    });
  }, [destinations]);

  const resultColor = r => r?.startsWith('W') ? '#4ade80' : r?.startsWith('L') ? '#f87171' : '#64748b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a', fontFamily: 'DM Sans, sans-serif', color: '#fff', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#154734', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
        >
          ← All Sports
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Baylor {sport.label} {sport.season}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Travel Demands</div>
        </div>
        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTER_LABELS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelectedDest(null); }}
              style={{
                background: filter === f ? '#FFB81C' : 'rgba(255,255,255,0.1)',
                color: filter === f ? '#000' : '#fff',
                border: 'none', borderRadius: 4, padding: '5px 12px',
                cursor: 'pointer', fontSize: 12, fontWeight: filter === f ? 700 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        {/* Timezone toggle */}
        <button
          onClick={() => setShowTimezones(v => !v)}
          style={{
            background: showTimezones ? 'rgba(99,179,237,0.2)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${showTimezones ? 'rgba(99,179,237,0.5)' : 'rgba(255,255,255,0.2)'}`,
            color: showTimezones ? 'rgba(99,179,237,0.9)' : '#64748b',
            borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 12,
          }}
        >
          Time Zones
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map */}
        <USMap
          sport={sport}
          destinations={destinations}
          selectedDest={selectedDest}
          hoveredDest={hoveredDest}
          onHover={setHoveredDest}
          onSelect={handleSelect}
          showTimezones={showTimezones}
        />

        {/* Sidebar */}
        <div style={{ width: 300, background: '#0c1420', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          {/* Stat cards */}
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>
            {[
              { label: 'Total Miles', value: `${Math.round(totalMiles).toLocaleString()}`, sub: 'season travel' },
              { label: 'Away Trips',  value: awayTrips,              sub: 'unique destinations' },
              { label: 'Home Games', value: homeGames,              sub: 'at Waco' },
              { label: 'Conf. Games', value: confGames,             sub: 'Big 12' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ background: '#1e293b', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: colors.conference }}>{value}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Farthest trip */}
          {farthestDest && (
            <div style={{ margin: '0 16px 12px', background: '#1e293b', borderRadius: 6, padding: '10px 12px', borderLeft: `3px solid ${colors.nonConference}` }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Farthest Trip</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{farthestDest.location}</div>
              <div style={{ fontSize: 11, color: colors.nonConference, fontFamily: 'JetBrains Mono, monospace' }}>
                {Math.round(farthestDest.mi).toLocaleString()} mi one-way
              </div>
            </div>
          )}

          {/* Destination list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            {sortedDests.map(dest => {
              const isExpanded = selectedDest?.location === dest.location;
              const trip = dest.tripId ? trips.find(t => t.id === dest.tripId) : null;
              const mi = dest.home ? null : haversine(home.lat, home.lng, dest.lat, dest.lng);
              return (
                <div
                  key={dest.location}
                  onClick={() => handleSelect(dest)}
                  style={{
                    background: isExpanded ? '#1e293b' : 'transparent',
                    border: `1px solid ${isExpanded ? '#334155' : 'transparent'}`,
                    borderRadius: 6, marginBottom: 4, padding: '8px 10px', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {dest.home ? '⌂ ' : ''}{dest.location}
                      </div>
                      {trip && <div style={{ fontSize: 10, color: colors.nonConference }}>{trip.label}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                        {dest.games.length}g
                      </div>
                      {mi && <div style={{ fontSize: 10, color: '#475569' }}>{Math.round(mi).toLocaleString()} mi</div>}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #334155', paddingTop: 8 }}>
                      {dest.games.map((g, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontSize: 12 }}>
                          <div>
                            <span style={{ color: '#64748b', fontFamily: 'JetBrains Mono, monospace', marginRight: 6 }}>{g.date}</span>
                            {g.opponent}
                            {g.tournament && <span style={{ fontSize: 10, color: '#475569', marginLeft: 4 }}>({g.tournament})</span>}
                          </div>
                          <div style={{ color: resultColor(g.result), fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                            {g.result || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
