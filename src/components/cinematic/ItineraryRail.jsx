import { useRef, useEffect } from 'react';

const MODE_ICONS = { flight: '✈', bus: '🚌', charter: '✈', tbd: '·' };

// The season "receipt": every trip in date order, checking off as the tour
// visits each. Click a row to jump the tour there.
export default function ItineraryRail({ scenes, currentIdx, phase, totalMiles, onJump }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIdx]);

  const shownMiles = phase === 'finale'
    ? totalMiles
    : (scenes[currentIdx]?.cumulativeMiles ?? 0);

  return (
    <div style={{
      width: 312, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'rgba(8,17,32,0.88)', borderRight: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>
          Season Itinerary
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {scenes.map(scene => {
          const visited = phase === 'finale' || scene.index < currentIdx;
          const active = phase === 'tour' && scene.index === currentIdx;
          return (
            <div
              key={scene.id}
              ref={active ? activeRef : null}
              onClick={() => onJump(scene.index)}
              style={{
                padding: '9px 12px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
                background: active ? 'rgba(255,184,28,0.14)' : 'transparent',
                borderLeft: `3px solid ${active ? '#FFB81C' : 'transparent'}`,
                opacity: visited ? 0.55 : active ? 1 : 0.8,
                transition: 'background 0.3s, opacity 0.3s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: active ? 700 : 600, color: visited ? '#94a3b8' : '#fff', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {visited ? '✓ ' : ''}{scene.label}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: active ? '#FFB81C' : '#64748b', flexShrink: 0 }}>
                  {Math.round(scene.tripMiles).toLocaleString()} mi
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {scene.dateRange}
                {scene.travelMode && <span style={{ marginLeft: 6 }}>{MODE_ICONS[scene.travelMode] || ''}</span>}
                {scene.tournament && <span style={{ marginLeft: 6, color: '#4ecdc4' }}>{scene.tournament}</span>}
              </div>
              {active && (
                <div style={{ marginTop: 5 }}>
                  {scene.games.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#cbd5e1', padding: '1px 0' }}>
                      <span>{g.date} · {g.opponent}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: g.result?.startsWith('W') ? '#4ade80' : g.result?.startsWith('L') ? '#f87171' : '#64748b' }}>
                        {g.result || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>
          Miles Traveled
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#FFB81C', lineHeight: 1.3 }}>
          {Math.round(shownMiles).toLocaleString()}
          <span style={{ fontSize: 13, color: '#64748b' }}> / {Math.round(totalMiles).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
