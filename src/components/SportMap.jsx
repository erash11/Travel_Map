import { useState, useMemo } from 'react';
import USMap from './USMap.jsx';
import { groupByDest } from '../utils/groupByDest.js';
import { calcTotalMiles } from '../utils/calcMiles.js';
import { parseDate } from '../utils/parseDate.js';
import { haversine } from '../utils/haversine.js';
import { computeTimezoneChanges, TZ_LABEL_COLORS, TZ_ABBR } from '../utils/timezones.js';
import { detectCongestion, dayOfYearToDisplay } from '../utils/congestion.js';

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

  const tzChanges = useMemo(
    () => computeTimezoneChanges(allDests, trips, home),
    [allDests, trips, home]
  );
  const totalCrossings = useMemo(
    () => Object.values(tzChanges).reduce((sum, dests) => sum + dests.length, 0),
    [tzChanges]
  );

  const congestionPeriods = useMemo(
    () => sport.congestionThreshold
      ? detectCongestion(sport.games, sport.congestionThreshold)
      : [],
    [sport]
  );

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
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {label}
                  {label === 'Away Trips' && congestionPeriods.length > 0 && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} title="High load periods detected" />
                  )}
                </div>
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

          {/* Time Zone Changes */}
          {totalCrossings > 0 && (
            <div style={{ margin: '0 16px 12px', background: '#1e293b', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Time Zone Changes
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>
                  {totalCrossings} crossing{totalCrossings !== 1 ? 's' : ''}
                </div>
              </div>
              {['Eastern', 'Mountain', 'Pacific'].filter(z => tzChanges[z]).map(zone => (
                <div
                  key={zone}
                  onClick={() => {
                    const first = tzChanges[zone][0];
                    if (first) setSelectedDest(prev => prev?.location === first.location ? null : first);
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #283548', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: TZ_LABEL_COLORS[zone] }} />
                    <span style={{ fontSize: 12 }}>{zone} Time</span>
                    <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'JetBrains Mono, monospace' }}>({TZ_ABBR[zone]})</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {tzChanges[zone].length} trip{tzChanges[zone].length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* High Load Periods */}
          {congestionPeriods.length > 0 && (
            <div style={{ margin: '0 16px 12px', background: '#1e293b', borderRadius: 6, padding: '10px 12px', borderLeft: '3px solid #f97316' }}>
              <div style={{ fontSize: 10, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                High Load Periods
              </div>
              {congestionPeriods.map((period, i) => {
                const locations = [...new Set(period.games.filter(g => !g.home).map(g => g.location))];
                return (
                  <div key={i} style={{ marginBottom: i < congestionPeriods.length - 1 ? 8 : 0, paddingBottom: i < congestionPeriods.length - 1 ? 8 : 0, borderBottom: i < congestionPeriods.length - 1 ? '1px solid #283548' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#f97316' }}>
                        {dayOfYearToDisplay(period.startDoy)} – {dayOfYearToDisplay(period.endDoy)}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{period.gameCount}g</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>
                      {locations.length > 0 ? locations.join(', ') : 'All home games'}
                    </div>
                  </div>
                );
              })}
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
