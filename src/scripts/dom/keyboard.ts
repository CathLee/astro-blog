/**
 * Keyboard event utilities for accessibility.
 */
export type KeyboardActivationKey = 'Enter' | ' '
export type KeyboardDismissalKey = 'Escape'

export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' '
}

export function isDismissalKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape'
}

export function addActivationHandler(
  element: Element,
  handler: () => void,
): void {
  element.addEventListener('keydown', (e) => {
    if (e instanceof KeyboardEvent && isActivationKey(e)) {
      e.preventDefault()
      handler()
    }
  })
}

export function addDismissalHandler(
  handler: () => void,
  condition?: () => boolean,
): void {
  document.addEventListener('keydown', (e) => {
    if (e instanceof KeyboardEvent && isDismissalKey(e)) {
      if (!condition || condition()) {
        handler()
      }
    }
  })
}
