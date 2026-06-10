const KEY = 'travelmap.importedSports';

// localStorage persistence for imported sports. Degrades to empty on any
// corruption/quota problem — never crashes the grid.
export function loadImportedSports() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveImportedSport(sport) {
  const list = loadImportedSports().filter(s => s.sport !== sport.sport);
  list.push(sport);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function removeImportedSport(sportId) {
  const list = loadImportedSports().filter(s => s.sport !== sportId);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}
