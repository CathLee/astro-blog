import type { UserConfig } from '~/types'

export const userConfig: Partial<UserConfig> = {
  // Override the default config here
  site: {
    title: '我的观点们',
    subtitle: 'Some Tech\'s Blog',
    author: 'Yuer',
    description: '在这里记录我的一些技术观点和生活点滴。',
    navLinks: [
      {
        name: 'Posts',
        href: '/',
      },
      {
        name: 'Archive',
        href: '/archive',
      },
      {
        name: 'Categories',
        href: '/categories',
      },
      {
        name: 'About',
        href: '/about',
      },
      {
        name: '影集',
        href: '/gallery',
      },
    ],
  },
  appearance: {
    locale: 'zh-cn',
    theme: 'system', // 使用 system 模式，支持手动切换和自动跟随系统
  },
  // seo: { twitter: "@moeyua13" },
}
