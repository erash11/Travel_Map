import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { FIPS_TIMEZONES, TZ_FILL_COLORS, TZ_LABEL_COLORS } from '../utils/timezones.js';

function decodeTopo(topo) {
  const { arcs, transform, objects } = topo;
  const { scale, translate } = transform;
  const decoded = arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });
  function resolve(idx) { return idx >= 0 ? decoded[idx] : [...decoded[~idx]].reverse(); }
  function ring(indices) {
    let c = [];
    indices.forEach(i => { const pts = resolve(i); if (c.length) pts.shift(); c = c.concat(pts); });
    return c;
  }
  return objects.states.geometries.map(g => {
    const base = { id: g.id, properties: g.properties || {} };
    if (g.type === 'Polygon') return { type: 'Feature', ...base, geometry: { type: 'Polygon', coordinates: g.arcs.map(r => ring(r)) } };
    if (g.type === 'MultiPolygon') return { type: 'Feature', ...base, geometry: { type: 'MultiPolygon', coordinates: g.arcs.map(p => p.map(r => ring(r))) } };
    return null;
  }).filter(Boolean);
}

export default function USMap({ sport, destinations, selectedDest, hoveredDest, onHover, onSelect, showTimezones }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [dims, setDims] = useState({ w: 900, h: 560 });
  const [zoom, setZoom] = useState({ k: 1, x: 0, y: 0 });

  const home = sport.home;
  const trips = sport.trips || [];
  const colors = sport.colors;

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => r.json())
      .then(topo => setFeatures(decodeTopo(topo)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 50) setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;
    const zb = d3.zoom().scaleExtent([1, 8]).on('zoom', e => {
      setZoom({ k: e.transform.k, x: e.transform.x, y: e.transform.y });
    });
    svg.call(zb);
    svgRef.current.__zoomBehavior = zb;
    return () => svg.on('.zoom', null);
  }, []);

  const handleZoomIn  = useCallback(() => { const s = d3.select(svgRef.current); const zb = svgRef.current.__zoomBehavior; if (zb) s.transition().duration(300).call(zb.scaleBy, 1.5); }, []);
  const handleZoomOut = useCallback(() => { const s = d3.select(svgRef.current); const zb = svgRef.current.__zoomBehavior; if (zb) s.transition().duration(300).call(zb.scaleBy, 0.67); }, []);
  const handleReset   = useCallback(() => { const s = d3.select(svgRef.current); const zb = svgRef.current.__zoomBehavior; if (zb) s.transition().duration(400).call(zb.transform, d3.zoomIdentity); }, []);

  const projection = useMemo(() => d3.geoAlbersUsa().scale(dims.w * 1.25).translate([dims.w / 2, dims.h / 2]), [dims]);
  const pathGen = useMemo(() => d3.geoPath().projection(projection), [projection]);
  const proj = useCallback((lat, lng) => projection([lng, lat]), [projection]);
  const homeXY = useMemo(() => proj(home.lat, home.lng), [proj, home]);
  const active = selectedDest || hoveredDest;

  function arcPath(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;
    const bend = Math.min(dist * 0.28, 70);
    const mx = (x1 + x2) / 2 - (dy / dist) * bend;
    const my = (y1 + y2) / 2 + (dx / dist) * bend;
    return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  }

  function getTravelMode(dest) {
    if (!dest.tripId) {
      const g = dest.games.find(g => g.travelMode);
      return g ? g.travelMode : 'tbd';
    }
    const g = dest.games.find(g => g.travelMode);
    if (g) return g.travelMode;
    const trip = trips.find(t => t.id === dest.tripId);
    return trip ? (trip.travelMode || 'tbd') : 'tbd';
  }

  function travelModeDash(mode) {
    if (mode === 'bus') return '6,4';
    if (mode === 'tbd') return '2,3';
    return null;
  }

  const awayDests = destinations.filter(d => !d.home);

  const tripRoutes = useMemo(() => {
    const routes = [];
    const handled = new Set();
    trips.forEach(trip => {
      const stops = trip.stops.map(loc => awayDests.find(d => d.location === loc)).filter(Boolean);
      if (stops.length < 2) return;
      const isActive = active && stops.some(s => s.location === active.location);
      const mode = trip.travelMode || 'tbd';
      const dash = travelModeDash(mode);
      const legs = [];
      const allStops = [{ lat: home.lat, lng: home.lng }, ...stops, { lat: home.lat, lng: home.lng }];
      for (let i = 0; i < allStops.length - 1; i++) {
        const p1 = proj(allStops[i].lat, allStops[i].lng) || [0, 0];
        const p2 = proj(allStops[i + 1].lat, allStops[i + 1].lng) || [0, 0];
        legs.push({ path: arcPath(p1[0], p1[1], p2[0], p2[1]), x2: p2[0], y2: p2[1] });
      }
      routes.push({ trip, stops, legs, isActive, dash });
      stops.forEach(s => handled.add(s.location));
    });
    return { routes, handledLocations: handled };
  }, [awayDests, trips, home, active, proj]);

  const soloArcs = useMemo(() => {
    if (!homeXY) return [];
    return awayDests
      .filter(d => !tripRoutes.handledLocations.has(d.location))
      .map(d => {
        const xy = proj(d.lat, d.lng);
        if (!xy) return null;
        const isActive = active && active.location === d.location;
        const mode = getTravelMode(d);
        const dash = travelModeDash(mode);
        return { dest: d, path: arcPath(homeXY[0], homeXY[1], xy[0], xy[1]), dx: xy[0], dy: xy[1], isActive, dash };
      })
      .filter(Boolean);
  }, [awayDests, homeXY, active, proj, tripRoutes.handledLocations]);

  const arcColor = (dest) => dest.games.some(g => g.conference) ? colors.conference : colors.nonConference;

  if (!homeXY) return <div ref={containerRef} style={{ flex: 1 }} />;

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{ display: 'block', cursor: 'grab', userSelect: 'none' }}
      >
        <g transform={`translate(${zoom.x},${zoom.y}) scale(${zoom.k})`}>
          {/* State base fills */}
          {features.map((f, i) => (
            <path key={`bg-${i}`} d={pathGen(f)} fill="#1e293b" />
          ))}

          {/* Timezone tints — rendered over base fills, under borders */}
          {showTimezones && features.map((f, i) => {
            const fips = String(f.id).padStart(2, '0');
            const zone = FIPS_TIMEZONES[fips];
            if (!zone || zone === 'Alaska' || zone === 'Hawaii') return null;
            return (
              <path
                key={`tz-${i}`}
                d={pathGen(f)}
                fill={TZ_FILL_COLORS[zone]}
                stroke="none"
                style={{ pointerEvents: 'none' }}
              />
            );
          })}

          {/* State borders */}
          {features.map((f, i) => (
            <path key={`border-${i}`} d={pathGen(f)} fill="none" stroke="#334155" strokeWidth={0.5 / zoom.k} />
          ))}

          {/* Trip routes (multi-stop) */}
          {tripRoutes.routes.map(({ trip, legs, isActive, dash }) =>
            legs.map((leg, li) => (
              <path
                key={`trip-${trip.id}-${li}`}
                d={leg.path}
                fill="none"
                stroke={isActive ? '#fff' : '#4ecdc4'}
                strokeWidth={(isActive ? 2.2 : 1.4) / zoom.k}
                strokeDasharray={dash ? dash.split(',').map(v => `${parseFloat(v) / zoom.k}`).join(',') : undefined}
                opacity={isActive ? 1 : 0.55}
                filter={isActive ? 'url(#glow)' : undefined}
              />
            ))
          )}

          {/* Solo arcs */}
          {soloArcs.map(({ dest, path, isActive, dash }) => (
            <path
              key={`arc-${dest.location}`}
              d={path}
              fill="none"
              stroke={isActive ? '#fff' : arcColor(dest)}
              strokeWidth={(isActive ? 2.2 : 1.4) / zoom.k}
              strokeDasharray={dash ? dash.split(',').map(v => `${parseFloat(v) / zoom.k}`).join(',') : undefined}
              opacity={isActive ? 1 : 0.6}
              filter={isActive ? 'url(#glow)' : undefined}
            />
          ))}

          {/* Destination dots */}
          {awayDests.map(d => {
            const xy = proj(d.lat, d.lng);
            if (!xy) return null;
            const isActive = active && active.location === d.location;
            return (
              <circle
                key={`dot-${d.location}`}
                cx={xy[0]} cy={xy[1]}
                r={(isActive ? 6 : 4) / zoom.k}
                fill={isActive ? '#fff' : arcColor(d)}
                stroke={isActive ? arcColor(d) : 'none'}
                strokeWidth={1.5 / zoom.k}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => onHover(d)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect(d)}
                filter={isActive ? 'url(#glow)' : undefined}
              />
            );
          })}

          {/* Location label on hover */}
          {active && (() => {
            const xy = proj(active.lat, active.lng);
            if (!xy) return null;
            return (
              <text
                x={xy[0]} y={xy[1] - 10 / zoom.k}
                textAnchor="middle"
                fontSize={11 / zoom.k}
                fill="#fff"
                fontFamily="JetBrains Mono, monospace"
                style={{ pointerEvents: 'none' }}
              >
                {active.location}
              </text>
            );
          })()}

          {/* Home dot (Waco) */}
          {homeXY && (
            <circle
              cx={homeXY[0]} cy={homeXY[1]}
              r={5 / zoom.k}
              fill={colors.conference}
              stroke="#fff"
              strokeWidth={1.5 / zoom.k}
            />
          )}

          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
        </g>

        {/* Fixed timezone labels (outside zoom transform) */}
        {showTimezones && (
          <g style={{ pointerEvents: 'none' }}>
            {[
              { zone: 'Pacific',  x: 0.10 },
              { zone: 'Mountain', x: 0.30 },
              { zone: 'Central',  x: 0.55 },
              { zone: 'Eastern',  x: 0.80 },
            ].map(({ zone, x }) => (
              <text
                key={`tz-label-${zone}`}
                x={dims.w * x}
                y={28}
                textAnchor="middle"
                fontSize={11}
                fill={TZ_LABEL_COLORS[zone]}
                fontFamily="DM Sans, sans-serif"
                fontWeight="700"
                letterSpacing="0.08em"
              >
                {zone.toUpperCase()}
              </text>
            ))}
          </g>
        )}
      </svg>

      {/* Travel mode legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        background: 'rgba(15,23,42,0.85)', border: '1px solid #1e293b',
        borderRadius: 6, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {[
          { mode: 'flight',  label: 'Flight / Charter', dash: null },
          { mode: 'bus',     label: 'Bus',               dash: '6px 4px' },
          { mode: 'tbd',     label: 'TBD',               dash: '2px 3px' },
        ].map(({ mode, label, dash }) => (
          <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={32} height={10}>
              <line
                x1={0} y1={5} x2={32} y2={5}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray={dash || undefined}
              />
            </svg>
            <span style={{ color: '#64748b', fontSize: 10, fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {zoom.k > 1.05 && (
          <div style={{ color: '#64748b', fontSize: 11, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
            {Math.round(zoom.k * 100)}%
          </div>
        )}
        {[{ label: '+', fn: handleZoomIn }, { label: '−', fn: handleZoomOut }, { label: '⊙', fn: handleReset }].map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            style={{ width: 32, height: 32, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 4, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
