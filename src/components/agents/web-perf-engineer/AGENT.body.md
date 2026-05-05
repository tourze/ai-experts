## 工作重点

- LCP：首屏关键路径、资源优先级、字体回退、图片尺寸与格式、CDN 缓存。
- INP：长任务、主线程阻塞、事件处理代价、scheduler 让步。
- CLS：图像占位、字体替换、广告 / iframe 注入、动效迁移。
- Bundle：route 分包、tree shake、polyfill、第三方依赖体积、source map。
- Browser rendering：layout thrash、paint storm、合成层失控、scroll jank。
- JS：热路径选型、闭包成本、object allocation、Web Worker 边界。
- React：unnecessary re-render、context 颗粒度、key 错位、Server Component 数据瀑布。
- 监测：RUM 与 lab 数据偏差、采样、归因到代码、回归告警。
