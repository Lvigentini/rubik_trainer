/**
 * Theme preference: a device UI setting (explicitly exempt from the
 * in-memory-only progress rule — see spec §5). Values are 'light' | 'dark';
 * absence means "follow the system preference" (handled by the
 * `@media (prefers-color-scheme: dark)` block in tokens.css).
 *
 * Importing this module applies any stored preference to
 * `document.documentElement.dataset.theme` synchronously, as a side effect,
 * before anything else renders — that's what avoids a flash of the wrong
 * theme. It must stay the very first import in `main.tsx`.
 */
export const THEME_STORAGE_KEY = 'rubik-trainer-theme';

export type ThemePreference = 'light' | 'dark';

export function readStoredTheme(): ThemePreference | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode, disabled cookies, etc.) — the
    // preference simply won't persist across reloads.
  }
}

export function applyTheme(theme: ThemePreference): void {
  document.documentElement.dataset.theme = theme;
}

const stored = readStoredTheme();
if (stored) {
  applyTheme(stored);
}
