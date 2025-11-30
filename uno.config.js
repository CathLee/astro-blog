import presetAttributify from '@unocss/preset-attributify'
import transformerDirectives from '@unocss/transformer-directives'
import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetWind3,
  transformerVariantGroup,
} from 'unocss'
import presetTheme from 'unocss-preset-theme'
import { themeConfig } from './src/.config'

const { colorsDark, colorsLight, fonts } = themeConfig.appearance

const cssExtend = {
  ':root': {
    '--prose-borders': '#eee',
  },

  'code::before,code::after': {
    content: 'none',
  },

  ':where(:not(pre):not(a) > code)': {
    'white-space': 'normal',
    'word-wrap': 'break-word',
    'padding': '2px 4px',
    'color': '#c7254e',
    'font-size': '90%',
    'background-color': '#f9f2f4',
    'border-radius': '4px',
  },

  'li': {
    'white-space': 'normal',
    'word-wrap': 'break-word',
  },
}

export default defineConfig({
  rules: [
    [
      /^row-(\d+)-(\d)$/,
      ([, start, end]) => ({ 'grid-row': `${start}/${end}` }),
    ],
    [
      /^col-(\d+)-(\d)$/,
      ([, start, end]) => ({ 'grid-column': `${start}/${end}` }),
    ],
    [
      /^scrollbar-hide$/,
      ([_]) => `.scrollbar-hide { scrollbar-width:none;-ms-overflow-style: none; }
      .scrollbar-hide::-webkit-scrollbar {display:none;}`,
    ],
  ],
  presets: [
    presetWind3(),
    presetTypography({ cssExtend }),
    presetAttributify(),
    presetIcons({ scale: 1.2, warn: true }),
    presetTheme ({
      theme: {
        dark: {
          colors: { ...colorsDark, shadow: '#FFFFFF0A' },
          // TODO 需要配置代码块颜色
        },
      },
    }),
  ],
  theme: {
    colors: { ...colorsLight, shadow: '#0000000A' },
    fontFamily: fonts,
  },
  shortcuts: [
    ['post-title', 'text-5 font-bold lh-7.5 m-0'],

    // Gallery page shortcuts
    ['gallery-container', 'max-w-300 mx-auto px-4 py-8'],
    ['gallery-header', 'text-center mb-12 md:mb-8'],
    ['gallery-title', 'text-10 md:text-8 font-700 mb-2 c-primary'],
    ['gallery-subtitle', 'text-4.5 c-text-secondary m-0'],
    ['timeline', 'relative pl-8 md:pl-6'],
    ['timeline-year', 'relative mb-12'],
    ['year-marker', 'flex items-center mb-8 -ml-8 md:(-ml-6 relative top-auto) sticky top-4 z-10 bg-[var(--c-bg)] py-2'],
    ['year-dot', 'w-5 h-5 md:(w-4 h-4) rounded-full bg-primary border-4 md:border-3 border-[var(--c-bg)] shadow-[0_0_0_3px_var(--c-primary)] md:shadow-[0_0_0_2px_var(--c-primary)] flex-shrink-0 z-2'],
    ['year-label', 'text-8 md:text-6 font-700 c-primary m-0 ml-6 md:ml-4 tracking-wider'],
    ['year-content', 'flex flex-col'],
    ['empty-state', 'text-center px-8 py-16 c-text-secondary'],
    ['empty-hint', 'text-3.5 mb-4'],

    // PhotoCard component shortcuts
    ['photo-card', 'grid grid-cols-[2fr_3fr] md:grid-cols-1 gap-8 md:gap-4 mb-12 md:mb-8 p-6 md:p-4 bg-[var(--c-bg)] rounded-2 transition-all duration-300 ease hover:(-translate-y-1 shadow-[0_8px_24px_var(--c-shadow)])'],
    ['photo-image', 'overflow-hidden rounded-1.5 aspect-[4/3] md:aspect-[16/9]'],
    ['photo-content', 'flex flex-col justify-center gap-3'],
    ['photo-title', 'text-6 md:text-5 font-600 m-0 c-primary'],
    ['photo-meta', 'text-3.5 c-text-secondary flex items-center gap-2'],
    ['photo-description', 'text-4 md:text-3.75 lh-1.8 c-text'],
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: [
    ...themeConfig.site.socialLinks.map(social => `i-mdi-${social.name}`),
    'i-mdi-content-copy',
    'i-mdi-check',
    'i-mdi-weather-sunny',
    'i-mdi-weather-night',
  ],
})
