/**
 * Theme management utilities.
 * Handles light/dark mode with localStorage persistence and system preference detection.
 */

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const DARK_CLASS = 'dark'

/**
 * Get the current theme from localStorage or system preference.
 */
export function getTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  }

  // Fallback to system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return 'light'
}

/**
 * Set the theme and persist to localStorage.
 */
export function setTheme(theme: Theme): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme)
  }

  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add(DARK_CLASS)
    }
    else {
      document.documentElement.classList.remove(DARK_CLASS)
    }
  }
}

/**
 * Toggle between light and dark themes.
 */
export function toggleTheme(): Theme {
  const currentTheme = getTheme()
  const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
  return newTheme
}

/**
 * Initialize theme on page load.
 * Call this early in your page lifecycle.
 */
export function initTheme(): void {
  const theme = getTheme()
  setTheme(theme)
}

/**
 * Listen for system theme preference changes.
 */
export function watchSystemTheme(callback: (theme: Theme) => void): void {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      // Only apply system preference if user hasn't set a manual preference
      if (typeof localStorage !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        callback(newTheme)
      }
    })
  }
}
