import { useState } from 'react';
import SportGrid from './components/SportGrid.jsx';
import SportMap from './components/SportMap.jsx';

export default function App() {
  const [view, setView] = useState({ page: 'grid' });

  if (view.page === 'sport') {
    return (
      <SportMap
        sport={view.sport}
        onBack={() => setView({ page: 'grid' })}
      />
    );
  }

  return (
    <SportGrid
      onSelect={sport => setView({ page: 'sport', sport })}
    />
  );
}
