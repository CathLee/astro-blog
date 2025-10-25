import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  unocss: true,
  astro: true,
  rules: {
    // 禁用与 Prettier 冲突的规则
    'antfu/if-newline': 'off',
    'style/brace-style': 'off',
  },
  // 对 Markdown 文件禁用严格的代码检查
  markdown: false,
})
