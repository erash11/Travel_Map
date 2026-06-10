import { useRef, useEffect, useMemo, useState } from 'react';
import Globe from 'react-globe.gl';

const FLY_MS = 1400;

// Renders the 3D globe: visited arcs stay lit, the active scene's legs animate,
// destination dots pulse. Camera flies to the active scene's first stop.
// phase: 'tour' (follow scenes) | 'finale' (pull back, everything lit)
export default function GlobeStage({ scenes, currentIdx, phase, home, colors }) {
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const arcColor = scene => scene.conference ? colors.conference : colors.nonConference;

  const arcsData = useMemo(() => {
    const visible = phase === 'finale' ? scenes : scenes.slice(0, currentIdx + 1);
    return visible.flatMap(scene =>
      scene.legs.map(leg => ({
        startLat: leg.from.lat, startLng: leg.from.lng,
        endLat: leg.to.lat, endLng: leg.to.lng,
        color: arcColor(scene),
        active: phase === 'tour' && scene.index === currentIdx,
      }))
    );
  }, [scenes, currentIdx, phase, colors]);

  const pointsData = useMemo(() => {
    const visible = phase === 'finale' ? scenes : scenes.slice(0, currentIdx + 1);
    const pts = visible.flatMap(scene =>
      scene.stops.map(stop => ({ lat: stop.lat, lng: stop.lng, color: arcColor(scene) }))
    );
    return [{ lat: home.lat, lng: home.lng, color: '#ffffff' }, ...pts];
  }, [scenes, currentIdx, phase, home, colors]);

  const ringsData = useMemo(() => {
    if (phase !== 'tour') return [];
    const scene = scenes[currentIdx];
    if (!scene) return [];
    return scene.stops.map(stop => ({ lat: stop.lat, lng: stop.lng, color: arcColor(scene) }));
  }, [scenes, currentIdx, phase, colors]);

  // Camera follows the tour
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    if (phase === 'finale') {
      globe.pointOfView({ lat: 38, lng: -97, altitude: 1.7 }, FLY_MS);
      return;
    }
    const scene = scenes[currentIdx];
    if (!scene) return;
    const stop = scene.stops[0];
    // Aim between home and the destination so the arc stays in frame
    globe.pointOfView(
      { lat: (home.lat + stop.lat) / 2, lng: (home.lng + stop.lng) / 2, altitude: 0.9 },
      FLY_MS
    );
  }, [scenes, currentIdx, phase, home]);

  // Initial position over Waco; disable distracting default interactions
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.pointOfView({ lat: home.lat, lng: home.lng, altitude: 1.2 }, 0);
    const controls = globe.controls();
    controls.autoRotate = false;
    controls.enableZoom = true;
  }, [home]);

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {dims.w > 0 && (
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(5,13,26,1)"
          globeImageUrl={`${import.meta.env.BASE_URL}earth-night.jpg`}
          atmosphereColor="#4ecdc4"
          atmosphereAltitude={0.18}
          arcsData={arcsData}
          arcColor="color"
          arcAltitudeAutoScale={0.4}
          arcStroke={d => d.active ? 0.65 : 0.35}
          arcDashLength={d => d.active ? 0.6 : 1}
          arcDashGap={d => d.active ? 0.3 : 0}
          arcDashAnimateTime={d => d.active ? 1800 : 0}
          pointsData={pointsData}
          pointColor="color"
          pointAltitude={0.012}
          pointRadius={0.32}
          ringsData={ringsData}
          ringColor="color"
          ringMaxRadius={2.4}
          ringPropagationSpeed={1.6}
          ringRepeatPeriod={900}
        />
      )}
    </div>
  );
}
