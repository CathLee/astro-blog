// Global type definitions for window extensions and custom types

declare global {
  interface Window {
    /**
     * Opens the image viewer with the provided image source and title
     * @param imageSrc - URL or path to the image
     * @param imageTitle - Title/alt text for the image
     */
    openImageViewer?: (imageSrc: string, imageTitle: string) => void
  }
}

// This export is required to make this a module and augment the global scope
export {}
