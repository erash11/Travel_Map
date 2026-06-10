import { useState, useEffect, useMemo, useCallback } from 'react';
import GlobeStage from './GlobeStage.jsx';
import ItineraryRail from './ItineraryRail.jsx';
import { buildTimeline } from '../../utils/buildTimeline.js';
import { computeTimezoneChanges } from '../../utils/timezones.js';
import { groupByDest } from '../../utils/groupByDest.js';

const SCENE_MS = 4500;

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Full-screen cinematic season tour. Auto-plays one scene per road trip;
// space = pause/play, ←/→ = prev/next, Esc = exit, rail click = jump.
export default function CinematicMode({ sport, onClose }) {
  const scenes = useMemo(() => buildTimeline(sport), [sport]);
  const totalMiles = scenes.length ? scenes[scenes.length - 1].cumulativeMiles : 0;

  const tzCount = useMemo(() => {
    const dests = groupByDest(sport.games);
    const changes = computeTimezoneChanges(dests, sport.trips || [], sport.home);
    return Object.keys(changes).length;
  }, [sport]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const supported = useMemo(webglAvailable, []);

  const phase = idx >= scenes.length ? 'finale' : 'tour';

  const advance = useCallback(() => {
    setIdx(i => Math.min(i + 1, scenes.length));
  }, [scenes.length]);

  useEffect(() => {
    if (!playing || phase === 'finale') return;
    const t = setTimeout(advance, SCENE_MS);
    return () => clearTimeout(t);
  }, [playing, phase, idx, advance]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
      else if (e.key === 'ArrowRight') advance();
      else if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, advance]);

  function jump(i) {
    setIdx(i);
    setPlaying(false);
  }

  function replay() {
    setIdx(0);
    setPlaying(true);
  }

  const btnStyle = {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 14,
  };

  if (!supported) {
    return (
      <div style={overlayStyle}>
        <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', fontSize: 15, maxWidth: 360 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🌐</div>
          Cinematic mode needs WebGL, which isn't available on this device or browser.
          The 2D map has all the same data.
          <div style={{ marginTop: 18 }}>
            <button onClick={onClose} style={btnStyle}>Back to map</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <ItineraryRail
        scenes={scenes}
        currentIdx={idx}
        phase={phase}
        totalMiles={totalMiles}
        onJump={jump}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
        <GlobeStage
          scenes={scenes}
          currentIdx={idx}
          phase={phase}
          home={sport.home}
          colors={sport.colors}
        />

        {/* Title + close */}
        <div style={{ position: 'absolute', top: 16, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
              Baylor {sport.label} {sport.season}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              A Season on the Road
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnStyle, pointerEvents: 'auto', fontSize: 16, lineHeight: 1, padding: '8px 12px' }}>
            ✕
          </button>
        </div>

        {/* Finale totals card */}
        {phase === 'finale' && (
          <div style={{
            position: 'absolute', bottom: 86, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(8,17,32,0.92)', border: '1px solid rgba(255,184,28,0.35)',
            borderRadius: 12, padding: '22px 34px', textAlign: 'center', backdropFilter: 'blur(6px)',
          }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
              {sport.season} Season Totals
            </div>
            <div style={{ display: 'flex', gap: 36, justifyContent: 'center' }}>
              {[
                [Math.round(totalMiles).toLocaleString(), 'miles traveled'],
                [scenes.length, 'road trips'],
                [tzCount, 'time zones crossed'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div style={{ fontSize: 30, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#FFB81C' }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playback controls */}
        <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setIdx(i => Math.max(i - 1, 0))} style={btnStyle} title="Previous trip (←)">‹</button>
          {phase === 'finale' ? (
            <button onClick={replay} style={{ ...btnStyle, background: 'rgba(255,184,28,0.18)', borderColor: 'rgba(255,184,28,0.5)', color: '#FFB81C', fontWeight: 700 }}>
              ↺ Replay
            </button>
          ) : (
            <button onClick={() => setPlaying(p => !p)} style={{ ...btnStyle, minWidth: 96, fontWeight: 700 }} title="Pause/play (space)">
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
          )}
          <button onClick={advance} style={btnStyle} title="Next trip (→)">›</button>
          <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>
            {phase === 'finale' ? 'Season complete' : `Trip ${idx + 1} of ${scenes.length}`}
          </span>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
  background: '#050d1a', fontFamily: 'DM Sans, sans-serif',
};
