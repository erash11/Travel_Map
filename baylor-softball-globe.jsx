import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";

// ── Schedule Data ──────────────────────────────────────────────
const WACO = { lat: 31.5493, lng: -97.1467 };

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
  { date: "Mar 11", opponent: "Stetson", location: "DeLand, FL", lat: 29.0283, lng: -81.3032, home: false, result: null, conference: false },
  { date: "Mar 13", opponent: "UCF", location: "Orlando, FL", lat: 28.6024, lng: -81.2001, home: false, result: null, conference: true },
  { date: "Mar 14", opponent: "UCF", location: "Orlando, FL", lat: 28.6024, lng: -81.2001, home: false, result: null, conference: true },
  { date: "Mar 15", opponent: "UCF", location: "Orlando, FL", lat: 28.6024, lng: -81.2001, home: false, result: null, conference: true },
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
    if (!map[k]) map[k] = { location: g.location, lat: g.lat, lng: g.lng, home: g.home, games: [] };
    map[k].games.push(g);
  });
  return Object.values(map);
}

function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function createArcPoints(startLat, startLng, endLat, endLng, radius, segments = 64) {
  const start = latLngToVec3(startLat, startLng, radius);
  const end = latLngToVec3(endLat, endLng, radius);
  const dist = start.distanceTo(end);
  const arcHeight = Math.min(dist * 0.4, 0.5);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(radius + arcHeight);
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3();
    p.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x;
    p.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y;
    p.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * mid.z + t * t * end.z;
    points.push(p);
  }
  return points;
}

// ── Globe Component ────────────────────────────────────────────
function Globe({ destinations, selectedDest, onSelectDest }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});
  const arcMeshesRef = useRef([]);
  const dotMeshesRef = useRef([]);
  const frameRef = useRef(0);
  const mouseRef = useRef({ isDown: false, prevX: 0, prevY: 0 });
  const rotRef = useRef({ x: -0.55, y: 2.5 });
  const autoRotateRef = useRef(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    // Lights
    const ambient = new THREE.AmbientLight(0x334455, 1.8);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Globe sphere
    const globeGeo = new THREE.SphereGeometry(1.5, 96, 96);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x0a1628,
      emissive: 0x061018,
      specular: 0x222222,
      shininess: 15,
      transparent: true,
      opacity: 0.92,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere glow
    const glowGeo = new THREE.SphereGeometry(1.58, 64, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x1a472a,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Wireframe grid on globe
    const wireGeo = new THREE.SphereGeometry(1.502, 36, 18);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x1a472a, wireframe: true, transparent: true, opacity: 0.12 });
    globe.add(new THREE.Mesh(wireGeo, wireMat));

    // Pivot group for rotation
    const pivot = new THREE.Group();
    pivot.add(globe);
    scene.add(pivot);

    sceneRef.current = { renderer, scene, camera, pivot, globe };

    // Mouse controls
    const onDown = (e) => {
      mouseRef.current.isDown = true;
      mouseRef.current.prevX = e.clientX || e.touches?.[0]?.clientX || 0;
      mouseRef.current.prevY = e.clientY || e.touches?.[0]?.clientY || 0;
      autoRotateRef.current = false;
    };
    const onUp = () => { mouseRef.current.isDown = false; };
    const onMove = (e) => {
      if (!mouseRef.current.isDown) return;
      const cx = e.clientX || e.touches?.[0]?.clientX || 0;
      const cy = e.clientY || e.touches?.[0]?.clientY || 0;
      const dx = cx - mouseRef.current.prevX;
      const dy = cy - mouseRef.current.prevY;
      rotRef.current.y += dx * 0.005;
      rotRef.current.x += dy * 0.005;
      rotRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotRef.current.x));
      mouseRef.current.prevX = cx;
      mouseRef.current.prevY = cy;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    renderer.domElement.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("touchmove", onMove, { passive: true });

    // Animation
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (autoRotateRef.current) {
        rotRef.current.y += 0.001;
      }
      pivot.rotation.x = rotRef.current.x;
      pivot.rotation.y = rotRef.current.y;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      renderer.domElement.removeEventListener("mousedown", onDown);
      renderer.domElement.removeEventListener("mousemove", onMove);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update arcs and dots when destinations or selection changes
  useEffect(() => {
    const { pivot } = sceneRef.current;
    if (!pivot) return;
    const globe = pivot.children[0];
    if (!globe) return;

    // Clear old arcs and dots
    arcMeshesRef.current.forEach(m => { globe.remove(m); m.geometry?.dispose(); m.material?.dispose(); });
    dotMeshesRef.current.forEach(m => { globe.remove(m); m.geometry?.dispose(); m.material?.dispose(); });
    arcMeshesRef.current = [];
    dotMeshesRef.current = [];

    const R = 1.505;

    // Waco marker (larger, gold)
    const wacoPos = latLngToVec3(WACO.lat, WACO.lng, R);
    const wacoDotGeo = new THREE.SphereGeometry(0.025, 16, 16);
    const wacoDotMat = new THREE.MeshBasicMaterial({ color: 0xFFB81C });
    const wacoDot = new THREE.Mesh(wacoDotGeo, wacoDotMat);
    wacoDot.position.copy(wacoPos);
    globe.add(wacoDot);
    dotMeshesRef.current.push(wacoDot);

    // Waco ring
    const ringGeo = new THREE.RingGeometry(0.035, 0.045, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFB81C, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(wacoPos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    globe.add(ring);
    dotMeshesRef.current.push(ring);

    const awayDests = destinations.filter(d => !d.home);

    awayDests.forEach(d => {
      const isSelected = selectedDest && selectedDest.location === d.location;
      const isConf = d.games.some(g => g.conference);
      const color = isConf ? 0xFFB81C : 0x4ecdc4;
      const dotR = isSelected ? 0.022 : 0.014;
      const arcOpacity = isSelected ? 0.9 : 0.3;

      // Destination dot
      const pos = latLngToVec3(d.lat, d.lng, R);
      const dotGeo = new THREE.SphereGeometry(dotR, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      globe.add(dot);
      dotMeshesRef.current.push(dot);

      if (isSelected) {
        const selRingGeo = new THREE.RingGeometry(0.03, 0.038, 32);
        const selRingMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
        const selRing = new THREE.Mesh(selRingGeo, selRingMat);
        selRing.position.copy(pos);
        selRing.lookAt(new THREE.Vector3(0, 0, 0));
        globe.add(selRing);
        dotMeshesRef.current.push(selRing);
      }

      // Arc line
      const arcPts = createArcPoints(WACO.lat, WACO.lng, d.lat, d.lng, R);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
      const arcMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: arcOpacity, linewidth: 1 });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globe.add(arcLine);
      arcMeshesRef.current.push(arcLine);
    });
  }, [destinations, selectedDest]);

  // Rotate to selected destination
  useEffect(() => {
    if (!selectedDest) return;
    autoRotateRef.current = false;
    const targetLng = selectedDest.lng;
    const targetLat = selectedDest.lat;
    rotRef.current.y = -((targetLng + 90) * Math.PI) / 180;
    rotRef.current.x = -(targetLat * Math.PI) / 180 * 0.6;
  }, [selectedDest]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        cursor: "grab",
        position: "relative",
      }}
    />
  );
}

// ── Main App ───────────────────────────────────────────────────
export default function App() {
  const [filter, setFilter] = useState("all");
  const [selectedDest, setSelectedDest] = useState(null);

  const filteredGames = useMemo(() => {
    if (filter === "all") return games;
    if (filter === "home") return games.filter(g => g.home);
    if (filter === "away") return games.filter(g => !g.home);
    if (filter === "conference") return games.filter(g => g.conference);
    return games;
  }, [filter]);

  const destinations = useMemo(() => groupByDest(filteredGames), [filteredGames]);
  const allDestinations = useMemo(() => groupByDest(games), []);
  const awayAll = useMemo(() => allDestinations.filter(d => !d.home), [allDestinations]);

  const stats = useMemo(() => {
    let totalMiles = 0;
    awayAll.forEach(d => { totalMiles += haversine(WACO.lat, WACO.lng, d.lat, d.lng) * 2; });
    const farthest = awayAll.reduce((max, d) => {
      const dist = haversine(WACO.lat, WACO.lng, d.lat, d.lng);
      return dist > max.dist ? { dest: d, dist } : max;
    }, { dest: null, dist: 0 });
    return {
      totalMiles: Math.round(totalMiles),
      awayTrips: awayAll.length,
      homeGames: games.filter(g => g.home).length,
      awayGames: games.filter(g => !g.home).length,
      confGames: games.filter(g => g.conference).length,
      farthest,
    };
  }, [awayAll]);

  const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6 };
  const parseDate = (d) => {
    const parts = d.split(" ");
    return (months[parts[0]] || 0) * 100 + parseInt(parts[1]) || 0;
  };

  const sorted = useMemo(() =>
    [...destinations].sort((a, b) => parseDate(a.games[0].date) - parseDate(b.games[0].date)),
    [destinations]
  );

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#060b14",
      color: "#e0ddd6",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,184,28,0.2); border-radius: 4px; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Top Bar */}
      <div style={{
        background: "linear-gradient(90deg, #154734 0%, #1a472a 40%, #0d2818 100%)",
        borderBottom: "3px solid #FFB81C",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize: "22px",
            color: "#FFB81C",
            letterSpacing: "-0.3px",
          }}>
            BAYLOR SOFTBALL 2026
          </h1>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "rgba(255,184,28,0.55)",
            letterSpacing: "3px",
            marginTop: "2px",
          }}>
            SEASON TRAVEL GLOBE
          </p>
        </div>

        {/* Stat Pills */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { val: stats.totalMiles.toLocaleString(), label: "MILES", color: "#FFB81C" },
            { val: stats.awayTrips, label: "TRIPS", color: "#4ecdc4" },
            { val: `${stats.homeGames}H / ${stats.awayGames}A`, label: "GAMES", color: "#e0ddd6" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", fontWeight: 600, color: s.color }}>{s.val}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "2px", color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { key: "all", label: "ALL" },
            { key: "away", label: "AWAY" },
            { key: "conference", label: "BIG 12" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setSelectedDest(null); }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                padding: "5px 12px",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "1px",
                border: filter === f.key ? "1.5px solid #FFB81C" : "1.5px solid rgba(255,184,28,0.2)",
                borderRadius: "3px",
                background: filter === f.key ? "rgba(255,184,28,0.15)" : "transparent",
                color: filter === f.key ? "#FFB81C" : "rgba(255,184,28,0.5)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Globe */}
        <div style={{
          flex: 1,
          position: "relative",
          background: "radial-gradient(ellipse at center, #0a1628 0%, #060b14 70%)",
        }}>
          <Globe
            destinations={destinations}
            selectedDest={selectedDest}
            onSelectDest={setSelectedDest}
          />

          {/* Drag hint */}
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "2px",
            color: "rgba(255,255,255,0.2)",
            animation: "pulse 3s infinite",
          }}>
            DRAG TO ROTATE
          </div>

          {/* Legend */}
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            display: "flex",
            gap: "16px",
            padding: "8px 12px",
            background: "rgba(6,11,20,0.85)",
            border: "1px solid rgba(255,184,28,0.1)",
            borderRadius: "4px",
          }}>
            {[
              { color: "#FFB81C", label: "Big 12" },
              { color: "#4ecdc4", label: "Non-Conf" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Selected detail overlay */}
          {selectedDest && (
            <div style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              background: "rgba(6,11,20,0.92)",
              border: "1px solid rgba(255,184,28,0.2)",
              borderRadius: "6px",
              padding: "16px",
              maxWidth: "280px",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: selectedDest.home ? "#FFB81C" : selectedDest.games.some(g => g.conference) ? "#FFB81C" : "#4ecdc4",
                  }}>
                    {selectedDest.location}
                  </div>
                  {!selectedDest.home && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#777", marginTop: "2px" }}>
                      {Math.round(haversine(WACO.lat, WACO.lng, selectedDest.lat, selectedDest.lng)).toLocaleString()} miles from Waco
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDest(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "0 0 0 8px",
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ marginTop: "10px" }}>
                {selectedDest.games.map((g, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#aaa" }}>
                      {g.date} vs {g.opponent}
                    </span>
                    {g.result ? (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: g.result.startsWith("W") ? "#4ecdc4" : "#ff6b6b",
                      }}>
                        {g.result}
                      </span>
                    ) : (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#555" }}>TBD</span>
                    )}
                  </div>
                ))}
              </div>
              {selectedDest.games[0]?.tournament && (
                <div style={{
                  marginTop: "8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "rgba(255,184,28,0.4)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}>
                  {selectedDest.games[0].tournament}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          width: "300px",
          flexShrink: 0,
          borderLeft: "1px solid rgba(255,184,28,0.08)",
          background: "rgba(6,11,20,0.95)",
          overflowY: "auto",
          padding: "12px",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "2.5px",
            color: "rgba(255,184,28,0.4)",
            marginBottom: "12px",
            paddingBottom: "8px",
            borderBottom: "1px solid rgba(255,184,28,0.08)",
          }}>
            DESTINATIONS
          </div>

          {/* Farthest trip callout */}
          {stats.farthest.dest && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(78,205,196,0.08), rgba(78,205,196,0.02))",
                border: "1px solid rgba(78,205,196,0.15)",
                borderRadius: "5px",
                padding: "10px 12px",
                marginBottom: "12px",
                cursor: "pointer",
              }}
              onClick={() => setSelectedDest(stats.farthest.dest)}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "2px", color: "#4ecdc4" }}>
                FARTHEST
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#e0ddd6", marginTop: "2px" }}>
                {stats.farthest.dest.location}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#666", marginTop: "1px" }}>
                {Math.round(stats.farthest.dist).toLocaleString()} mi one-way
              </div>
            </div>
          )}

          {sorted.map((d, i) => {
            const dist = d.home ? 0 : Math.round(haversine(WACO.lat, WACO.lng, d.lat, d.lng));
            const isConf = d.games.some(g => g.conference);
            const isSelected = selectedDest?.location === d.location;
            const accentColor = d.home ? "#FFB81C" : isConf ? "#FFB81C" : "#4ecdc4";

            return (
              <div
                key={i}
                onClick={() => setSelectedDest(isSelected ? null : d)}
                style={{
                  padding: "9px 10px",
                  marginBottom: "4px",
                  borderRadius: "4px",
                  background: isSelected ? "rgba(255,184,28,0.08)" : "transparent",
                  borderLeft: isSelected ? `3px solid ${accentColor}` : "3px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: accentColor,
                      flexShrink: 0,
                      opacity: isSelected ? 1 : 0.5,
                    }} />
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isSelected ? accentColor : "#c5c2bb",
                    }}>
                      {d.location}
                    </span>
                    {d.home && (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "8px",
                        letterSpacing: "1px",
                        color: "rgba(255,184,28,0.35)",
                      }}>HOME</span>
                    )}
                  </div>
                  {!d.home && (
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "#555",
                    }}>
                      {dist.toLocaleString()} mi
                    </span>
                  )}
                </div>
                <div style={{ marginLeft: "15px", marginTop: "3px" }}>
                  {d.games.slice(0, isSelected ? 99 : 2).map((g, j) => (
                    <div key={j} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "1px 0",
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#777",
                    }}>
                      <span>{g.date} {g.opponent}</span>
                      {g.result ? (
                        <span style={{ color: g.result.startsWith("W") ? "#4ecdc4" : "#ff6b6b", fontWeight: 600 }}>{g.result}</span>
                      ) : (
                        <span style={{ color: "#444" }}>--</span>
                      )}
                    </div>
                  ))}
                  {!isSelected && d.games.length > 2 && (
                    <div style={{ fontSize: "9px", color: "#444", fontFamily: "'JetBrains Mono', monospace" }}>
                      +{d.games.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
