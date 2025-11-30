// Type definitions for astro-seo
// Reason: astro-seo exports types from .astro files which TypeScript doesn't recognize properly

declare module 'astro-seo' {
  export interface Link extends Omit<HTMLLinkElement, 'sizes'> {
    sizes?: string
  }

  export interface Meta extends HTMLMetaElement {
    property?: string
  }

  export interface SEOProps {
    charset?: string
    title?: string
    description?: string
    canonical?: string
    noindex?: boolean
    nofollow?: boolean
    openGraph?: {
      basic?: {
        title?: string
        type?: string
        image?: string
        url?: string
      }
      optional?: {
        audio?: string
        description?: string
        determiner?: string
        locale?: string
        localeAlternate?: string[]
        siteName?: string
        video?: string
      }
      image?: {
        url?: string
        secureUrl?: string
        type?: string
        width?: number
        height?: number
        alt?: string
      }
      article?: {
        publishedTime?: string
        modifiedTime?: string
        expirationTime?: string
        authors?: string[]
        section?: string
        tags?: string[]
      }
    }
    twitter?: {
      card?: string
      site?: string
      creator?: string
    }
    extend?: {
      link?: Partial<Link>[]
      meta?: Partial<Meta>[]
    }
  }

  export const SEO: any
}
