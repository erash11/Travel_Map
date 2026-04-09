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
  const [showSchedule, setShowSchedule] = useState(false);

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
    awayDests.forEach(d => { if (d.tripId) seen.add(d.tripId); else seen.add(d.location); });
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
    () => sport.congestionThreshold ? detectCongestion(sport.games, sport.congestionThreshold) : [],
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

  const resultColor = r => r?.startsWith('W') ? '#16a34a' : r?.startsWith('L') ? '#dc2626' : '#94a3b8';

  // Derived values for floating detail card
  const selectedMi = selectedDest && !selectedDest.home
    ? haversine(home.lat, home.lng, selectedDest.lat, selectedDest.lng)
    : null;
  const selectedTrip = selectedDest?.tripId ? trips.find(t => t.id === selectedDest.tripId) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9', fontFamily: 'DM Sans, sans-serif', color: '#0f172a', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: '#154734', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
        >
          ← All Sports
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Baylor {sport.label} {sport.season}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Travel Demands</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {FILTER_LABELS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelectedDest(null); }}
              style={{
                background: filter === f ? '#FFB81C' : 'rgba(255,255,255,0.1)',
                color: filter === f ? '#000' : '#fff',
                border: 'none', borderRadius: 4, padding: '5px 10px',
                cursor: 'pointer', fontSize: 12, fontWeight: filter === f ? 700 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowTimezones(v => !v)}
          style={{
            background: showTimezones ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.15)',
            border: `1px solid ${showTimezones ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0.3)'}`,
            color: showTimezones ? '#93c5fd' : 'rgba(255,255,255,0.6)',
            borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
          }}
        >
          Time Zones
        </button>
        <button
          onClick={() => setShowSchedule(v => !v)}
          style={{
            background: showSchedule ? 'rgba(255,184,28,0.18)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${showSchedule ? 'rgba(255,184,28,0.5)' : 'rgba(255,255,255,0.3)'}`,
            color: showSchedule ? '#FFB81C' : 'rgba(255,255,255,0.7)',
            borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
          }}
        >
          Schedule
        </button>
      </div>

      {/* Stats strip */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'stretch', flexShrink: 0, overflowX: 'auto',
      }}>
        {/* 4 primary stats */}
        {[
          { label: 'Total Miles',  value: Math.round(totalMiles).toLocaleString(), sub: 'season travel' },
          { label: 'Away Trips',   value: awayTrips,   sub: 'unique destinations' },
          { label: 'Home Games',   value: homeGames,   sub: 'at Waco' },
          { label: 'Conf. Games',  value: confGames,   sub: 'Big 12' },
        ].map(({ label, value, sub }, i) => (
          <div key={label} style={{ padding: '10px 20px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 4 }}>
              {label}
              {label === 'Away Trips' && congestionPeriods.length > 0 && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} title="High load periods detected" />
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: colors.conference, lineHeight: 1.2 }}>{value}</div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>{sub}</div>
          </div>
        ))}

        {/* Farthest trip */}
        {farthestDest && (
          <div style={{ padding: '10px 20px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Farthest Trip</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{farthestDest.location}</div>
            <div style={{ fontSize: 11, color: colors.nonConference, fontFamily: 'JetBrains Mono, monospace' }}>
              {Math.round(farthestDest.mi).toLocaleString()} mi one-way
            </div>
          </div>
        )}

        {/* TZ crossings */}
        {totalCrossings > 0 && (
          <div style={{ padding: '10px 20px', borderRight: congestionPeriods.length > 0 ? '1px solid #e2e8f0' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              TZ Crossings · {totalCrossings}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Eastern', 'Mountain', 'Pacific'].filter(z => tzChanges[z]).map(zone => (
                <div key={zone} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: TZ_LABEL_COLORS[zone], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#0f172a' }}>{TZ_ABBR[zone]}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{tzChanges[zone].length}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High load periods */}
        {congestionPeriods.length > 0 && (
          <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.07em' }}>High Load</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {congestionPeriods.map((p, i) => (
                <span key={i} style={{
                  fontSize: 10, color: '#f97316', fontFamily: 'JetBrains Mono, monospace',
                  background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 6px', borderRadius: 4,
                }}>
                  {dayOfYearToDisplay(p.startDoy)}–{dayOfYearToDisplay(p.endDoy)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <USMap
          sport={sport}
          destinations={destinations}
          selectedDest={selectedDest}
          hoveredDest={hoveredDest}
          onHover={setHoveredDest}
          onSelect={handleSelect}
          showTimezones={showTimezones}
        />

        {/* Floating destination detail card */}
        {selectedDest && (
          <div style={{
            position: 'absolute', bottom: 80, left: 16,
            width: 264, maxHeight: 280,
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            zIndex: 10,
          }}>
            {/* Card header */}
            <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{selectedDest.location}</div>
                {selectedTrip && (
                  <div style={{ fontSize: 11, color: colors.nonConference, marginTop: 1 }}>{selectedTrip.label}</div>
                )}
                {selectedMi && (
                  <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                    {Math.round(selectedMi).toLocaleString()} mi one-way
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedDest(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 0 0 8px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
            {/* Game list */}
            <div style={{ overflowY: 'auto', padding: '6px 0' }}>
              {selectedDest.games.map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px', fontSize: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace', marginRight: 6, flexShrink: 0 }}>{g.date}</span>
                    <span style={{ color: '#0f172a' }}>{g.opponent}</span>
                    {g.tournament && (
                      <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>({g.tournament})</span>
                    )}
                  </div>
                  <div style={{ color: resultColor(g.result), fontFamily: 'JetBrains Mono, monospace', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                    {g.result || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule panel — slides in from the right */}
        {showSchedule && (
          <div style={{ width: 280, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>Schedule</div>
              <button
                onClick={() => setShowSchedule(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
              {sortedDests.map(dest => {
                const isSelected = selectedDest?.location === dest.location;
                const trip = dest.tripId ? trips.find(t => t.id === dest.tripId) : null;
                const mi = dest.home ? null : haversine(home.lat, home.lng, dest.lat, dest.lng);
                return (
                  <div
                    key={dest.location}
                    onClick={() => handleSelect(dest)}
                    style={{
                      background: isSelected ? '#f1f5f9' : 'transparent',
                      border: `1px solid ${isSelected ? '#e2e8f0' : 'transparent'}`,
                      borderRadius: 6, marginBottom: 4, padding: '8px 10px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                          {dest.home ? '⌂ ' : ''}{dest.location}
                        </div>
                        {trip && <div style={{ fontSize: 10, color: colors.nonConference }}>{trip.label}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                          {dest.games.length}g
                        </div>
                        {mi && <div style={{ fontSize: 10, color: '#94a3b8' }}>{Math.round(mi).toLocaleString()} mi</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
