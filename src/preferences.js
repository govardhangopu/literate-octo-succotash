export function readUserPreferences(storage, role, fallbackFilters) {
  try {
    const saved = JSON.parse(storage.getItem(`yuvaInternPreferences:${role}`) || '{}');
    return { theme: saved.theme === 'dark' ? 'dark' : 'light', filters: { ...fallbackFilters, ...(saved.filters || {}) } };
  } catch {
    return { theme: 'light', filters: { ...fallbackFilters } };
  }
}

export function writeUserPreferences(storage, role, preferences) {
  storage.setItem(`yuvaInternPreferences:${role}`, JSON.stringify(preferences));
}
