/**
 * Register callbacks for Swup page lifecycle events.
 */
export function onSwupPageView(callback: () => void): void {
  document.addEventListener('swup:page:view', callback)
}

export function onSwupContentReplaced(callback: () => void): void {
  document.addEventListener('swup:contentReplaced', callback)
}

/**
 * Initialize component both on page load and Swup transitions.
 * Combines onReady + onSwupPageView patterns.
 */
export function initWithSwup(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback)
  }
  else {
    callback()
  }
  onSwupPageView(callback)
}
