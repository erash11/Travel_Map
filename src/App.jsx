import { useState } from 'react';
import SportGrid from './components/SportGrid.jsx';
import SportMap from './components/SportMap.jsx';
import ImportPage from './components/import/ImportPage.jsx';

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

  if (view.page === 'import') {
    return (
      <ImportPage
        onBack={() => setView({ page: 'grid' })}
        onView={sport => setView({ page: 'sport', sport })}
      />
    );
  }

  return (
    <SportGrid
      onSelect={sport => setView({ page: 'sport', sport })}
      onImport={() => setView({ page: 'import' })}
    />
  );
}
