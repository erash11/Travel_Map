import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as d3 from "d3";

const WACO = { lat: 31.5493, lng: -97.1467 };

// Multi-stop trips: destinations that are part of the same road trip
// The team stays in Florida for both Stetson (DeLand) and UCF (Orlando)
const TRIP_SWINGS = [
  { id: "florida-swing", label: "Florida Swing", stops: ["DeLand, FL", "Orlando, FL"] },
];

const games = [
  { date: "Feb 5", opponent: "Mississippi State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "L 0-10", conference: false, tournament: "Getterman Classic" },
  { date: "Feb 6", opponent: "New Mexico", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 8-7", conference: false, tournament: "Getterman Classic" },
  { date: "Feb 6", opponent: "Wichita State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 3-2", conference: false, tournament: "Getterman Classic" },
  { date: "Feb 7", opponent: "Wichita State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 9-8", conference: false, tournament: "Getterman Classic" },
  { date: "Feb 8", opponent: "Northwestern St.", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 9-1", conference: false, tournament: "Getterman Classic" },
  { date: "Feb 10", opponent: "South Dakota St.", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 10-2", conference: false },
  { date: "Feb 12", opponent: "San Diego State", location: "San Diego, CA", lat: 32.7749, lng: -117.0714, home: false, result: "L 3-4", conference: false, tournament: "Campbell/Cartier Classic" },
  { date: "Feb 13", opponent: "Oregon State", location: "San Diego, CA", lat: 32.7749, lng: -117.0714, home: false, result: "W 5-4", conference: false, tournament: "Campbell/Cartier Classic" },
  { date: "Feb 13", opponent: "San Diego State", location: "San Diego, CA", lat: 32.7749, lng: -117.0714, home: false, result: "W 11-2", conference: false, tournament: "Campbell/Cartier Classic" },
  { date: "Feb 14", opponent: "Fordham", location: "San Diego, CA", lat: 32.7749, lng: -117.0714, home: false, result: "W 6-1", conference: false, tournament: "Campbell/Cartier Classic" },
  { date: "Feb 14", opponent: "North Dakota", location: "San Diego, CA", lat: 32.7749, lng: -117.0714, home: false, result: "W 2-0", conference: false, tournament: "Campbell/Cartier Classic" },
  { date: "Feb 20", opponent: "Lipscomb", location: "Clemson, SC", lat: 34.6834, lng: -82.8374, home: false, result: "W 6-4", conference: false, tournament: "Clemson Classic" },
  { date: "Feb 21", opponent: "Coastal Carolina", location: "Clemson, SC", lat: 34.6834, lng: -82.8374, home: false, result: "W 3-2", conference: false, tournament: "Clemson Classic" },
  { date: "Feb 21", opponent: "Clemson", location: "Clemson, SC", lat: 34.6834, lng: -82.8374, home: false, result: "L 0-8", conference: false, tournament: "Clemson Classic" },
  { date: "Feb 22", opponent: "Clemson", location: "Clemson, SC", lat: 34.6834, lng: -82.8374, home: false, result: "L 0-3", conference: false, tournament: "Clemson Classic" },
  { date: "Feb 25", opponent: "Sam Houston", location: "Huntsville, TX", lat: 30.7235, lng: -95.5508, home: false, result: "W 6-3", conference: false },
  { date: "Feb 28", opponent: "McNeese", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "L 4-5", conference: false },
  { date: "Feb 28", opponent: "McNeese", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "L 2-6", conference: false },
  { date: "Mar 1", opponent: "McNeese", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 8-0", conference: false },
  { date: "Mar 3", opponent: "Stephen F. Austin", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 4-0", conference: false },
  { date: "Mar 6", opponent: "Iowa State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 8-1", conference: false },
  { date: "Mar 6", opponent: "Iowa State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 4-2", conference: false },
  { date: "Mar 7-8", opponent: "Iowa State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: "W 5-4", conference: false },
  { date: "Mar 11", opponent: "Stetson", location: "DeLand, FL", lat: 29.0283, lng: -81.3032, home: false, result: null, conference: false, swing: "florida-swing" },
  { date: "Mar 13", opponent: "UCF", location: "Orlando, FL", lat: 28.6024, lng: -81.2001, home: false, result: null, conference: true, swing: "florida-swing" },
  { date: "Mar 14", opponent: "UCF", location: "Orlando, FL", lat: 28.6024, lng: -81.2001, home: false, result: null, conference: true, swing: "florida-swing" },
  { date: "Mar 15", opponent: "UCF", location: "Orlando, FL", lat: 28.6024, lng: -81.2001, home: false, result: null, conference: true, swing: "florida-swing" },
  { date: "Mar 20", opponent: "Texas", location: "Austin, TX", lat: 30.2849, lng: -97.7341, home: false, result: null, conference: false },
  { date: "Mar 21", opponent: "Texas", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: false },
  { date: "Mar 24", opponent: "UT Arlington", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: false },
  { date: "Mar 27", opponent: "Arizona", location: "Tucson, AZ", lat: 32.2319, lng: -110.9501, home: false, result: null, conference: true },
  { date: "Mar 28", opponent: "Arizona", location: "Tucson, AZ", lat: 32.2319, lng: -110.9501, home: false, result: null, conference: true },
  { date: "Mar 29", opponent: "Arizona", location: "Tucson, AZ", lat: 32.2319, lng: -110.9501, home: false, result: null, conference: true },
  { date: "Mar 31", opponent: "Incarnate Word", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: false },
  { date: "Apr 2", opponent: "Houston", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: false },
  { date: "Apr 3", opponent: "Houston", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 4", opponent: "Houston", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 6", opponent: "Lamar", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: false },
  { date: "Apr 8", opponent: "UT Arlington", location: "Arlington, TX", lat: 32.7299, lng: -97.1151, home: false, result: null, conference: false },
  { date: "Apr 10", opponent: "Kansas", location: "Lawrence, KS", lat: 38.9543, lng: -95.2558, home: false, result: null, conference: true },
  { date: "Apr 11", opponent: "Kansas", location: "Lawrence, KS", lat: 38.9543, lng: -95.2558, home: false, result: null, conference: true },
  { date: "Apr 12", opponent: "Kansas", location: "Lawrence, KS", lat: 38.9543, lng: -95.2558, home: false, result: null, conference: true },
  { date: "Apr 15", opponent: "Texas A&M", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: false },
  { date: "Apr 17", opponent: "Utah", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 18", opponent: "Utah", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 19", opponent: "Utah", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 22", opponent: "Texas State", location: "San Marcos, TX", lat: 29.8833, lng: -97.9414, home: false, result: null, conference: false },
  { date: "Apr 24", opponent: "Oklahoma State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 25", opponent: "Oklahoma State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 26", opponent: "Oklahoma State", location: "Waco, TX", lat: 31.5493, lng: -97.1467, home: true, result: null, conference: true },
  { date: "Apr 30", opponent: "Texas Tech", location: "Lubbock, TX", lat: 33.5843, lng: -101.8456, home: false, result: null, conference: true },
  { date: "May 1", opponent: "Texas Tech", location: "Lubbock, TX", lat: 33.5843, lng: -101.8456, home: false, result: null, conference: true },
  { date: "May 2", opponent: "Texas Tech", location: "Lubbock, TX", lat: 33.5843, lng: -101.8456, home: false, result: null, conference: true },
  { date: "May 6-9", opponent: "Big 12 Tournament", location: "Oklahoma City, OK", lat: 35.4676, lng: -97.5164, home: false, result: null, conference: true, tournament: "Big 12 Tournament" },
];

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function groupByDest(list) {
  const map = {};
  list.forEach(g => {
    const k = `${g.lat},${g.lng}`;
    if (!map[k]) map[k] = { location: g.location, lat: g.lat, lng: g.lng, home: g.home, games: [], swing: g.swing || null };
    map[k].games.push(g);
    if (g.swing) map[k].swing = g.swing;
  });
  return Object.values(map);
}

// Calculate total miles accounting for multi-stop swings
function calcTotalMiles(awayDests) {
  let total = 0;
  const swingHandled = new Set();
  awayDests.forEach(d => {
    if (d.swing && !swingHandled.has(d.swing)) {
      swingHandled.add(d.swing);
      const swing = TRIP_SWINGS.find(s => s.id === d.swing);
      if (swing) {
        const stops = swing.stops.map(loc => awayDests.find(dd => dd.location === loc)).filter(Boolean);
        if (stops.length > 0) {
          // Waco -> first stop
          total += haversine(WACO.lat, WACO.lng, stops[0].lat, stops[0].lng);
          // stop to stop
          for (let i = 0; i < stops.length - 1; i++) {
            total += haversine(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
          }
          // last stop -> Waco
          total += haversine(stops[stops.length - 1].lat, stops[stops.length - 1].lng, WACO.lat, WACO.lng);
        }
      }
    } else if (!d.swing) {
      total += haversine(WACO.lat, WACO.lng, d.lat, d.lng) * 2;
    }
  });
  return total;
}

const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6 };
function parseDate(d) { const p = d.split(" "); return (MONTHS[p[0]] || 0) * 100 + (parseInt(p[1]) || 0); }

function decodeTopo(topo) {
  const { arcs, transform, objects } = topo;
  const { scale, translate } = transform;
  const decoded = arcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
  });
  function resolve(idx) { return idx >= 0 ? decoded[idx] : [...decoded[~idx]].reverse(); }
  function ring(indices) {
    let c = [];
    indices.forEach(i => { const pts = resolve(i); if (c.length) pts.shift(); c = c.concat(pts); });
    return c;
  }
  return objects.states.geometries.map(g => {
    if (g.type === "Polygon") return { type: "Feature", properties: g.properties || {}, geometry: { type: "Polygon", coordinates: g.arcs.map(r => ring(r)) } };
    if (g.type === "MultiPolygon") return { type: "Feature", properties: g.properties || {}, geometry: { type: "MultiPolygon", coordinates: g.arcs.map(p => p.map(r => ring(r))) } };
    return null;
  }).filter(Boolean);
}

// ── Map ───────────────────────────────────────────────────────
function USMap({ destinations, selectedDest, hoveredDest, onHover, onSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [dims, setDims] = useState({ w: 900, h: 560 });
  const [zoom, setZoom] = useState({ k: 1, x: 0, y: 0 });

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
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

  // D3 zoom behavior
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;
    const zoomBehavior = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        setZoom({ k: event.transform.k, x: event.transform.x, y: event.transform.y });
      });
    svg.call(zoomBehavior);
    // Store for programmatic zoom
    svgRef.current.__zoomBehavior = zoomBehavior;
    return () => svg.on(".zoom", null);
  }, []);

  const handleZoomIn = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const zb = svgRef.current.__zoomBehavior;
    if (zb) svg.transition().duration(300).call(zb.scaleBy, 1.5);
  }, []);
  const handleZoomOut = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const zb = svgRef.current.__zoomBehavior;
    if (zb) svg.transition().duration(300).call(zb.scaleBy, 0.67);
  }, []);
  const handleReset = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const zb = svgRef.current.__zoomBehavior;
    if (zb) svg.transition().duration(400).call(zb.transform, d3.zoomIdentity);
  }, []);

  const projection = useMemo(() => d3.geoAlbersUsa().scale(dims.w * 1.25).translate([dims.w / 2, dims.h / 2]), [dims]);
  const pathGen = useMemo(() => d3.geoPath().projection(projection), [projection]);
  const proj = (lat, lng) => projection([lng, lat]);
  const wacoXY = proj(WACO.lat, WACO.lng);
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

  const awayDests = destinations.filter(d => !d.home);

  // Build swing route data for rendering
  const swingRoutes = useMemo(() => {
    const routes = [];
    const handled = new Set();
    TRIP_SWINGS.forEach(swing => {
      const stops = swing.stops.map(loc => awayDests.find(d => d.location === loc)).filter(Boolean);
      if (stops.length >= 2) {
        routes.push({ id: swing.id, label: swing.label, stops });
        stops.forEach(s => handled.add(s.location));
      }
    });
    return { routes, swingLocations: handled };
  }, [awayDests]);

  // Non-swing away destinations (get normal Waco arcs)
  const normalAway = awayDests.filter(d => !swingRoutes.swingLocations.has(d.location));

  // Check if a dest is part of an active swing
  const activeSwing = useMemo(() => {
    if (!active || active.home) return null;
    const swing = TRIP_SWINGS.find(s => s.stops.includes(active.location));
    return swing || null;
  }, [active]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${dims.w} ${dims.h}`} style={{ width: "100%", height: "100%", cursor: "grab" }}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="bigGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="wacoPulse"><stop offset="0%" stopColor="#FFB81C" stopOpacity="0.5" /><stop offset="100%" stopColor="#FFB81C" stopOpacity="0" /></radialGradient>
        </defs>

        <rect width={dims.w} height={dims.h} fill="#080d18" />

        <g transform={`translate(${zoom.x},${zoom.y}) scale(${zoom.k})`}>
          {/* States */}
          {features.map((f, i) => {
            const d = pathGen(f);
            return d ? <path key={i} d={d} fill="rgba(20,50,35,0.3)" stroke="rgba(255,184,28,0.06)" strokeWidth={0.7 / zoom.k} /> : null;
          })}

          {/* ── Normal (non-swing) inactive arcs ── */}
          {wacoXY && normalAway.map((dest, i) => {
            const xy = proj(dest.lat, dest.lng);
            if (!xy) return null;
            const isAct = active && active.location === dest.location;
            if (isAct) return null;
            const color = dest.games.some(g => g.conference) ? "#FFB81C" : "#4ecdc4";
            return <path key={`na${i}`} d={arcPath(wacoXY[0], wacoXY[1], xy[0], xy[1])} fill="none" stroke={color} strokeWidth={1.2 / zoom.k} strokeOpacity="0.14" strokeDasharray={`${5 / zoom.k} ${4 / zoom.k}`} />;
          })}

          {/* ── Swing route arcs (inactive) ── */}
          {wacoXY && swingRoutes.routes.map((route, ri) => {
            const isSwingActive = activeSwing && activeSwing.id === route.id;
            if (isSwingActive) return null;
            const stops = route.stops;
            const pts = [wacoXY, ...stops.map(s => proj(s.lat, s.lng)), wacoXY].filter(Boolean);
            return pts.slice(0, -1).map((p, i) => {
              const next = pts[i + 1];
              const isToWaco = i === pts.length - 2;
              const color = "#4ecdc4";
              return <path key={`sr${ri}-${i}`} d={arcPath(p[0], p[1], next[0], next[1])} fill="none" stroke={color} strokeWidth={1.2 / zoom.k} strokeOpacity="0.14" strokeDasharray={`${5 / zoom.k} ${4 / zoom.k}`} />;
            });
          })}

          {/* ── Active normal arc ── */}
          {wacoXY && active && !active.home && !activeSwing && (() => {
            const xy = proj(active.lat, active.lng);
            if (!xy) return null;
            const color = active.games.some(g => g.conference) ? "#FFB81C" : "#4ecdc4";
            const dist = Math.round(haversine(WACO.lat, WACO.lng, active.lat, active.lng));
            const d = arcPath(wacoXY[0], wacoXY[1], xy[0], xy[1]);
            const mx = (wacoXY[0] + xy[0]) / 2, my = (wacoXY[1] + xy[1]) / 2 - 18 / zoom.k;
            const fs = 9 / zoom.k;
            return (
              <g>
                <path d={d} fill="none" stroke={color} strokeWidth={3 / zoom.k} strokeOpacity="0.5" filter="url(#bigGlow)" />
                <path d={d} fill="none" stroke={color} strokeWidth={1.8 / zoom.k} strokeOpacity="0.9" />
                <rect x={mx - 28 / zoom.k} y={my - 10 / zoom.k} width={56 / zoom.k} height={17 / zoom.k} rx={3 / zoom.k} fill="rgba(8,13,24,0.92)" stroke={color} strokeWidth={0.5 / zoom.k} strokeOpacity="0.4" />
                <text x={mx} y={my + 2 / zoom.k} textAnchor="middle" fill={color} fontSize={fs} fontFamily="'JetBrains Mono', monospace" fontWeight="600">{dist.toLocaleString()} mi</text>
              </g>
            );
          })()}

          {/* ── Active swing route ── */}
          {wacoXY && activeSwing && (() => {
            const route = swingRoutes.routes.find(r => r.id === activeSwing.id);
            if (!route) return null;
            const stops = route.stops;
            const pts = [wacoXY, ...stops.map(s => proj(s.lat, s.lng)), wacoXY].filter(Boolean);
            const segments = [];
            let totalDist = haversine(WACO.lat, WACO.lng, stops[0].lat, stops[0].lng);
            for (let i = 0; i < stops.length - 1; i++) totalDist += haversine(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
            totalDist += haversine(stops[stops.length - 1].lat, stops[stops.length - 1].lng, WACO.lat, WACO.lng);

            for (let i = 0; i < pts.length - 1; i++) {
              const p = pts[i], n = pts[i + 1];
              segments.push(
                <g key={`as${i}`}>
                  <path d={arcPath(p[0], p[1], n[0], n[1])} fill="none" stroke="#4ecdc4" strokeWidth={3 / zoom.k} strokeOpacity="0.5" filter="url(#bigGlow)" />
                  <path d={arcPath(p[0], p[1], n[0], n[1])} fill="none" stroke="#4ecdc4" strokeWidth={1.8 / zoom.k} strokeOpacity="0.9" />
                </g>
              );
            }
            // Label total
            const midStop = stops[0];
            const midXY = proj(midStop.lat, midStop.lng);
            if (midXY) {
              const lx = (wacoXY[0] + midXY[0]) / 2, ly = (wacoXY[1] + midXY[1]) / 2 - 22 / zoom.k;
              const fs = 9 / zoom.k;
              const bw = 90 / zoom.k;
              segments.push(
                <g key="swing-label">
                  <rect x={lx - bw / 2} y={ly - 10 / zoom.k} width={bw} height={28 / zoom.k} rx={3 / zoom.k} fill="rgba(8,13,24,0.95)" stroke="#4ecdc4" strokeWidth={0.5 / zoom.k} strokeOpacity="0.4" />
                  <text x={lx} y={ly + 1 / zoom.k} textAnchor="middle" fill="#4ecdc4" fontSize={fs} fontFamily="'JetBrains Mono', monospace" fontWeight="600">Florida Swing</text>
                  <text x={lx} y={ly + 12 / zoom.k} textAnchor="middle" fill="rgba(78,205,196,0.6)" fontSize={fs * 0.85} fontFamily="'JetBrains Mono', monospace">{Math.round(totalDist).toLocaleString()} mi total</text>
                </g>
              );
            }
            return <g>{segments}</g>;
          })()}

          {/* ── Swing connector line (DeLand ↔ Orlando) always visible ── */}
          {!activeSwing && swingRoutes.routes.map((route, ri) => {
            const stops = route.stops.map(loc => awayDests.find(d => d.location === loc)).filter(Boolean);
            if (stops.length < 2) return null;
            return stops.slice(0, -1).map((s, si) => {
              const xy1 = proj(s.lat, s.lng);
              const xy2 = proj(stops[si + 1].lat, stops[si + 1].lng);
              if (!xy1 || !xy2) return null;
              return <line key={`conn${ri}-${si}`} x1={xy1[0]} y1={xy1[1]} x2={xy2[0]} y2={xy2[1]} stroke="#4ecdc4" strokeWidth={1 / zoom.k} strokeOpacity="0.2" strokeDasharray={`${3 / zoom.k} ${2 / zoom.k}`} />;
            });
          })}

          {/* ── Destination dots ── */}
          {awayDests.map((dest, i) => {
            const xy = proj(dest.lat, dest.lng);
            if (!xy) return null;
            const isAct = active && active.location === dest.location;
            const isSwingHighlight = activeSwing && TRIP_SWINGS.find(s => s.id === activeSwing.id)?.stops.includes(dest.location);
            const highlighted = isAct || isSwingHighlight;
            const isConf = dest.games.some(g => g.conference);
            const color = isConf ? "#FFB81C" : "#4ecdc4";
            const r = highlighted ? 7 / zoom.k : 4.5 / zoom.k;
            return (
              <g key={`d${i}`} onMouseEnter={() => onHover(dest)} onMouseLeave={() => onHover(null)} onClick={() => onSelect(dest)} style={{ cursor: "pointer" }}>
                <circle cx={xy[0]} cy={xy[1]} r={16 / zoom.k} fill="transparent" />
                {highlighted && (
                  <>
                    <circle cx={xy[0]} cy={xy[1]} r={r + 6 / zoom.k} fill="none" stroke={color} strokeWidth={0.8 / zoom.k} strokeOpacity="0.3">
                      <animate attributeName="r" from={r + 3 / zoom.k} to={r + 14 / zoom.k} dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="stroke-opacity" from="0.4" to="0" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={xy[0]} cy={xy[1]} r={r + 2 / zoom.k} fill="none" stroke={color} strokeWidth={1 / zoom.k} strokeOpacity="0.35" />
                  </>
                )}
                <circle cx={xy[0]} cy={xy[1]} r={r} fill={color} fillOpacity={highlighted ? 1 : 0.6} stroke="#080d18" strokeWidth={1.5 / zoom.k} filter={highlighted ? "url(#glow)" : undefined} />
                {highlighted && (
                  <g>
                    <rect x={xy[0] + 12 / zoom.k} y={xy[1] - 22 / zoom.k} width={Math.max(dest.location.length * 7 + 16, 80) / zoom.k} height={20 / zoom.k} rx={3 / zoom.k} fill="rgba(8,13,24,0.93)" stroke={color} strokeWidth={0.7 / zoom.k} strokeOpacity="0.5" />
                    <text x={xy[0] + 20 / zoom.k} y={xy[1] - 8 / zoom.k} fill={color} fontSize={11 / zoom.k} fontWeight="700" fontFamily="'DM Sans', sans-serif">{dest.location}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ── Waco ── */}
          {wacoXY && (
            <g onMouseEnter={() => { const h = destinations.find(d => d.home); if (h) onHover(h); }} onMouseLeave={() => onHover(null)} onClick={() => { const h = destinations.find(d => d.home); if (h) onSelect(h); }} style={{ cursor: "pointer" }}>
              <circle cx={wacoXY[0]} cy={wacoXY[1]} r={12 / zoom.k} fill="url(#wacoPulse)">
                <animate attributeName="r" from={12 / zoom.k} to={30 / zoom.k} dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <polygon points={`${wacoXY[0]},${wacoXY[1] - 9 / zoom.k} ${wacoXY[0] + 7 / zoom.k},${wacoXY[1]} ${wacoXY[0]},${wacoXY[1] + 9 / zoom.k} ${wacoXY[0] - 7 / zoom.k},${wacoXY[1]}`} fill="#FFB81C" stroke="#080d18" strokeWidth={2 / zoom.k} filter="url(#glow)" />
              <text x={wacoXY[0]} y={wacoXY[1] + 22 / zoom.k} textAnchor="middle" fill="#FFB81C" fontSize={10 / zoom.k} fontWeight="800" fontFamily="'DM Sans', sans-serif" letterSpacing={1.5 / zoom.k}>WACO</text>
              <text x={wacoXY[0]} y={wacoXY[1] + 32 / zoom.k} textAnchor="middle" fill="rgba(255,184,28,0.35)" fontSize={8 / zoom.k} fontFamily="'JetBrains Mono', monospace" letterSpacing={1 / zoom.k}>HOME</text>
            </g>
          )}

          {/* Legend */}
          <g transform={`translate(${14 / zoom.k}, ${(dims.h - 55) / zoom.k})`}>
            <rect x={-4 / zoom.k} y={-8 / zoom.k} width={230 / zoom.k} height={50 / zoom.k} rx={4 / zoom.k} fill="rgba(8,13,24,0.9)" stroke="rgba(255,184,28,0.08)" strokeWidth={0.7 / zoom.k} />
            <circle cx={10 / zoom.k} cy={5 / zoom.k} r={4 / zoom.k} fill="#FFB81C" /><text x={20 / zoom.k} y={9 / zoom.k} fill="rgba(255,255,255,0.45)" fontSize={10 / zoom.k} fontFamily="'DM Sans'">Big 12 Conference</text>
            <circle cx={10 / zoom.k} cy={22 / zoom.k} r={4 / zoom.k} fill="#4ecdc4" /><text x={20 / zoom.k} y={26 / zoom.k} fill="rgba(255,255,255,0.45)" fontSize={10 / zoom.k} fontFamily="'DM Sans'">Non-Conference</text>
            <line x1={132 / zoom.k} y1={2 / zoom.k} x2={155 / zoom.k} y2={2 / zoom.k} stroke="#4ecdc4" strokeWidth={1.5 / zoom.k} strokeDasharray={`${3 / zoom.k} ${2 / zoom.k}`} />
            <text x={162 / zoom.k} y={6 / zoom.k} fill="rgba(255,255,255,0.45)" fontSize={10 / zoom.k} fontFamily="'DM Sans'">Multi-stop</text>
            <polygon points={`${138 / zoom.k},${22 / zoom.k} ${143 / zoom.k},${28 / zoom.k} ${133 / zoom.k},${28 / zoom.k}`} fill="#FFB81C" /><text x={150 / zoom.k} y={26 / zoom.k} fill="rgba(255,255,255,0.45)" fontSize={10 / zoom.k} fontFamily="'DM Sans'">Home</text>
          </g>
        </g>
      </svg>

      {/* Zoom Controls */}
      <div style={{ position: "absolute", bottom: "16px", right: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {[
          { label: "+", onClick: handleZoomIn },
          { label: "−", onClick: handleZoomOut },
          { label: "⟳", onClick: handleReset },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} style={{
            width: "32px", height: "32px", borderRadius: "4px", border: "1px solid rgba(255,184,28,0.2)",
            background: "rgba(8,13,24,0.9)", color: "#FFB81C", fontSize: "16px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
          }}>{btn.label}</button>
        ))}
      </div>

      {/* Zoom level indicator */}
      {zoom.k > 1.05 && (
        <div style={{ position: "absolute", top: "8px", left: "8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,184,28,0.4)", letterSpacing: "1px" }}>
          {Math.round(zoom.k * 100)}%
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [filter, setFilter] = useState("all");
  const [selectedDest, setSelectedDest] = useState(null);
  const [hoveredDest, setHoveredDest] = useState(null);

  const filteredGames = useMemo(() => {
    if (filter === "all") return games;
    if (filter === "home") return games.filter(g => g.home);
    if (filter === "away") return games.filter(g => !g.home);
    if (filter === "conference") return games.filter(g => g.conference);
    return games;
  }, [filter]);

  const destinations = useMemo(() => groupByDest(filteredGames), [filteredGames]);
  const allDests = useMemo(() => groupByDest(games), []);
  const awayAll = useMemo(() => allDests.filter(d => !d.home), [allDests]);

  const stats = useMemo(() => {
    const totalMiles = calcTotalMiles(awayAll);
    const farthest = awayAll.reduce((max, d) => {
      const dist = haversine(WACO.lat, WACO.lng, d.lat, d.lng);
      return dist > max.dist ? { dest: d, dist } : max;
    }, { dest: null, dist: 0 });
    return { totalMiles: Math.round(totalMiles), awayTrips: awayAll.length, homeGames: games.filter(g => g.home).length, awayGames: games.filter(g => !g.home).length, confGames: games.filter(g => g.conference).length, farthest };
  }, [awayAll]);

  const sorted = useMemo(() => [...destinations].sort((a, b) => parseDate(a.games[0].date) - parseDate(b.games[0].date)), [destinations]);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#060b14", color: "#e0ddd6", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,184,28,0.2);border-radius:4px}
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(90deg, #154734 0%, #1a472a 40%, #0d2818 100%)", borderBottom: "3px solid #FFB81C", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "20px", color: "#FFB81C", letterSpacing: "-0.3px" }}>BAYLOR SOFTBALL 2026</h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,184,28,0.5)", letterSpacing: "2.5px", marginTop: "1px" }}>SEASON TRAVEL MAP</p>
        </div>
        <div style={{ display: "flex", gap: "5px" }}>
          {[{ key: "all", label: "ALL" }, { key: "away", label: "AWAY" }, { key: "home", label: "HOME" }, { key: "conference", label: "BIG 12" }].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setSelectedDest(null); }} style={{
              fontFamily: "'JetBrains Mono', monospace", padding: "4px 10px", fontSize: "9px", fontWeight: 600, letterSpacing: "1px",
              border: filter === f.key ? "1.5px solid #FFB81C" : "1.5px solid rgba(255,184,28,0.15)", borderRadius: "3px",
              background: filter === f.key ? "rgba(255,184,28,0.12)" : "transparent", color: filter === f.key ? "#FFB81C" : "rgba(255,184,28,0.4)", cursor: "pointer", transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, position: "relative", background: "#080d18" }}>
          <USMap
            destinations={destinations}
            selectedDest={selectedDest}
            hoveredDest={hoveredDest}
            onHover={setHoveredDest}
            onSelect={(d) => setSelectedDest(selectedDest?.location === d.location ? null : d)}
          />
        </div>

        {/* Sidebar */}
        <div style={{
          width: "320px",
          flexShrink: 0,
          borderLeft: "1px solid rgba(255,184,28,0.1)",
          background: "#0a0f1a",
          overflowY: "auto",
          padding: "16px",
        }}>
          {/* Summary Stats - 2x2 Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "20px",
          }}>
            {[
              { label: "Total Travel Miles", value: stats.totalMiles.toLocaleString(), sub: "round-trip est." },
              { label: "Away Trips", value: stats.awayTrips, sub: `${stats.awayGames} games` },
              { label: "Home Games", value: stats.homeGames, sub: "Getterman Stadium" },
              { label: "Big 12 Games", value: stats.confGames, sub: "conference" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(26,71,42,0.2)",
                border: "1px solid rgba(255,184,28,0.12)",
                borderRadius: "6px",
                padding: "12px",
              }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#FFB81C" }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "#999", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                <div style={{ fontSize: "10px", color: "#666", marginTop: "1px" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Farthest Trip */}
          {stats.farthest.dest && filter !== "home" && (
            <div
              onClick={() => setSelectedDest(stats.farthest.dest)}
              style={{
                background: "rgba(78,205,196,0.08)",
                border: "1px solid rgba(78,205,196,0.2)",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "10px", color: "#4ecdc4", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                Farthest Trip
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#e8e6e1", marginTop: "4px" }}>
                {stats.farthest.dest.location}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {Math.round(stats.farthest.dist).toLocaleString()} miles one-way
              </div>
            </div>
          )}

          {/* Trip Details Header */}
          <div style={{ marginBottom: "8px" }}>
            <h3 style={{
              fontSize: "12px",
              color: "#FFB81C",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 700,
              margin: "0 0 12px",
              paddingBottom: "6px",
              borderBottom: "1px solid rgba(255,184,28,0.15)",
            }}>
              {filter === "all" ? "All Destinations" : filter === "away" ? "Away Destinations" : filter === "home" ? "Home Schedule" : "Big 12 Schedule"}
            </h3>
          </div>

          {/* Destination List */}
          {sorted.map((d, i) => {
            const dist = d.home ? 0 : Math.round(haversine(WACO.lat, WACO.lng, d.lat, d.lng));
            const isConf = d.games.some(g => g.conference);
            const isSel = selectedDest?.location === d.location;
            const ac = d.home ? "#FFB81C" : isConf ? "#FFB81C" : "#4ecdc4";
            const swingInfo = d.swing ? TRIP_SWINGS.find(s => s.id === d.swing) : null;
            return (
              <div
                key={i}
                onClick={() => setSelectedDest(isSel ? null : d)}
                onMouseEnter={() => setHoveredDest(d)}
                onMouseLeave={() => setHoveredDest(null)}
                style={{
                  padding: "10px 12px",
                  marginBottom: "6px",
                  borderRadius: "6px",
                  background: isSel ? "rgba(255,184,28,0.1)" : "rgba(255,255,255,0.02)",
                  border: isSel ? "1px solid rgba(255,184,28,0.3)" : "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: d.home ? "#FFB81C" : isConf ? "#FFB81C" : "#4ecdc4",
                    }}>
                      {d.location}
                    </span>
                    {d.home && <span style={{ fontSize: "9px", color: "#FFB81C", marginLeft: "6px", opacity: 0.6 }}>HOME</span>}
                  </div>
                  {!d.home && (
                    <span style={{ fontSize: "11px", color: "#777" }}>{dist.toLocaleString()} mi</span>
                  )}
                </div>
                {swingInfo && (
                  <div style={{ marginTop: "3px", fontSize: "9px", color: "rgba(78,205,196,0.55)", letterSpacing: "0.3px" }}>
                    Part of {swingInfo.label}
                  </div>
                )}
                <div style={{ marginTop: "4px" }}>
                  {d.games.slice(0, isSel ? 99 : 2).map((g, j) => (
                    <div key={j} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#999",
                      padding: "2px 0",
                    }}>
                      <span>{g.date} vs {g.opponent}</span>
                      {g.result ? (
                        <span style={{
                          color: g.result.startsWith("W") ? "#4ecdc4" : "#ff6b6b",
                          fontWeight: 600,
                          fontSize: "10px",
                        }}>
                          {g.result}
                        </span>
                      ) : (
                        <span style={{ color: "#555", fontSize: "10px" }}>Upcoming</span>
                      )}
                    </div>
                  ))}
                  {!isSel && d.games.length > 2 && (
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
                      +{d.games.length - 2} more
                    </div>
                  )}
                </div>
                {d.games[0]?.tournament && (
                  <div style={{
                    marginTop: "4px",
                    fontSize: "9px",
                    color: "rgba(255,184,28,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    {d.games[0].tournament}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
