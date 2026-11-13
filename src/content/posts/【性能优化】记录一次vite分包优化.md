---
title: 【性能优化】记录一次vite分包优化
pubDate: 2025-08-23
categories: ['性能优化']
description: '使用 manualChunks、babel-plugin-lodash 等方式优化 Vite 项目的打包体积'
---

# 记录一次vite分包优化

1. 使用 manualChunks 将第三方库分离到不同的 chunk 中

   ```ts
   build: {
       rollupOptions: {
         output: {
           manualChunks: (id) => {
             // 将 recharts 相关库分离到单独的 chunk 中
             if (id.includes('node_modules/recharts') || 
                 id.includes('node_modules/d3') || 
                 id.includes('node_modules/victory')) {
               return 'recharts';
             }
             // 将 lodash 分离到单独的 chunk 中
             if (id.includes('node_modules/lodash')) {
               return 'lodash';
             }
             // 将 React 相关库分离到单独的 chunk 中
             if (id.includes('node_modules/react') || 
                 id.includes('node_modules/react-dom') || 
                 id.includes('node_modules/react-router-dom')) {
               return 'react';
             }
             // 将其他第三方库分离到 vendors chunk
             if (id.includes('node_modules')) {
               return 'vendor';
             }
           }
         }
       },
       // 启用 CSS 代码分割
       cssCodeSplit: true,
       // 启用源码映射，便于调试
       sourcemap: false,
       // 启用 chunk 大小警告的阈值（单位为 KB）
       chunkSizeWarningLimit: 1000,
     },
   ```

   

2. 使用 babel-plugin-lodash 对 Lodash 进行 tree-shaking 优化

3. babel-plugin-import对rechart ui库进行 按需代码改写 优化

   使用按需导入的方式导入 Recharts 组件

   ```ts
   plugins: [
       react({
         babel: {
           plugins: [
             'lodash', // 添加 babel-plugin-lodash 进行优化
             // 添加 babel-plugin-import 插件，自动转换 Recharts 的导入语句
             ['import', {
               libraryName: 'recharts',
               libraryDirectory: 'lib',
               camel2DashComponentName: false,
               customName: (name: string) => {
                 const mapping: Record<string, string> = {
                   // 图表类型
                   'AreaChart': 'chart/AreaChart',
                   'BarChart': 'chart/BarChart',
                   'LineChart': 'chart/LineChart',
                   'ComposedChart': 'chart/ComposedChart',
                   'PieChart': 'chart/PieChart',
                   'RadarChart': 'chart/RadarChart',
                   'ScatterChart': 'chart/ScatterChart',
                   'Treemap': 'chart/Treemap',
                   
                   // 笛卡尔组件
                   'Area': 'cartesian/Area',
                   'Bar': 'cartesian/Bar',
                   'Line': 'cartesian/Line',
                   'Scatter': 'cartesian/Scatter',
                   'XAxis': 'cartesian/XAxis',
                   'YAxis': 'cartesian/YAxis',
                   'ZAxis': 'cartesian/ZAxis',
                   'CartesianGrid': 'cartesian/CartesianGrid',
                   'CartesianAxis': 'cartesian/CartesianAxis',
                   'ReferenceLine': 'cartesian/ReferenceLine',
                   'ReferenceDot': 'cartesian/ReferenceDot',
                   'ReferenceArea': 'cartesian/ReferenceArea',
                   'ErrorBar': 'cartesian/ErrorBar',
                   'Brush': 'cartesian/Brush',
                   
                   // 组件
                   'ResponsiveContainer': 'component/ResponsiveContainer',
                   'Legend': 'component/Legend',
                   'Tooltip': 'component/Tooltip',
                   'Cell': 'component/Cell',
                   'Text': 'component/Text',
                   'Label': 'component/Label',
                   'LabelList': 'component/LabelList',
                 };
                 
                 return `recharts/lib/${mapping[name] || name}`;
               }
             }]
           ]
         }
       }),
       tailwindcss(),
       visualizer({
         filename: "./stats.html", // 明确指定输出文件名
         open: true, // 构建后自动打开
         brotliSize: true,
       }),
     ],
   ```

   

4. 使用更智能的分包策略，将相关依赖分组到同一个 chunk 中

旧

![image-20250609215319158](C:/Users/Cathy/AppData/Roaming/Typora/typora-user-images/image-20250609215319158.png)

![image-20250609215051818](C:/Users/Cathy/AppData/Roaming/Typora/typora-user-images/image-20250609215051818.png)

新

![image-20250609215326714](C:/Users/Cathy/AppData/Roaming/Typora/typora-user-images/image-20250609215326714.png)

![image-20250609215126726](C:/Users/Cathy/AppData/Roaming/Typora/typora-user-images/image-20250609215126726.png)

性能优化近80%