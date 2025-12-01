import GLightbox from 'glightbox'

// GLightbox doesn't have TypeScript definitions
// eslint-disable-next-line ts/no-explicit-any
type GlightboxInstance = any

// Global instance to prevent memory leaks
let lightboxInstance: GlightboxInstance | null = null

/**
 * Initialize GLightbox for gallery images with performance optimizations.
 * Uses singleton pattern to prevent multiple instances.
 *
 * @returns GLightbox instance for programmatic control if needed
 */
export function initGalleryLightbox(): GlightboxInstance {
  // Destroy existing instance to prevent memory leaks
  if (lightboxInstance) {
    try {
      lightboxInstance.destroy()
    }
    catch (e) {
      // Silently catch destroy errors
      console.warn('GLightbox destroy error:', e)
    }
    lightboxInstance = null
  }

  // Only initialize if .glightbox elements exist
  const elements = document.querySelectorAll('.glightbox')
  if (elements.length === 0) {
    return null
  }

  lightboxInstance = GLightbox({
    selector: '.glightbox',
    touchNavigation: true,
    loop: true,
    autoplayVideos: false,
    zoomable: true,
    draggable: true,
    closeButton: true,
    closeOnOutsideClick: true,
    keyboardNavigation: true,
    // Performance optimizations
    preload: true, // Preload adjacent images
    moreLength: 0, // Disable gallery counter for better performance
  })

  return lightboxInstance
}

/**
 * Initialize gallery lightbox with automatic Swup integration.
 * Call this once in your gallery page.
 */
export function setupGalleryLightbox(): void {
  function init() {
    // Use requestIdleCallback for non-blocking initialization
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        initGalleryLightbox()
      }, { timeout: 1000 })
    }
    else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        initGalleryLightbox()
      }, 100)
    }
  }

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  }
  else {
    init()
  }

  // Swup page transitions
  document.addEventListener('swup:page:view', init)
}

/**
 * Cleanup function to destroy lightbox instance.
 * Call this before page unload if needed.
 */
export function destroyGalleryLightbox(): void {
  if (lightboxInstance) {
    try {
      lightboxInstance.destroy()
    }
    catch (e) {
      console.warn('GLightbox destroy error:', e)
    }
    lightboxInstance = null
  }
}
