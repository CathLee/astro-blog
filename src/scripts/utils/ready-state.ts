/**
 * Execute callback when DOM is ready.
 * Handles both immediate execution and DOMContentLoaded event.
 */
export function onReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback)
  }
  else {
    callback()
  }
}
