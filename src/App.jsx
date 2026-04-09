import SportGrid from './components/SportGrid.jsx';
import SportMap from './components/SportMap.jsx';
import { useState } from 'react';

export default function App() {
  const [sport, setSport] = useState(null);
  if (sport) return <SportMap sport={sport} onBack={() => setSport(null)} />;
  return <SportGrid onSelect={setSport} />;
}
