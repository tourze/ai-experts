## 交叉引用
- 请求瀑布：`web-performance-diagnosis`。
- Bundle 体积：`bundle-optimization`。

## 代码模式
- **通用性能**：profiling、虚拟化、懒加载、bundle 分割、worker — 详见 [advanced.md](./advanced.md)。
- **重渲染模式**：memo / derived state / no-inline / transitions / refs / deps — 规则索引见 [rules/](./rules/)。
- **Store 订阅**：selector slicing、shallowEqual、computed store、Context 稳定性 — 模式与反例见 [advanced.md](./advanced.md)。

## 检查清单
- [ ] 先用 Profiler / Performance / 自定义计时确认了热点？
- [ ] 传给 memoized child 的对象、数组、回调引用稳定？
- [ ] derived state 走渲染期直算而不是 useEffect？
- [ ] 没在组件内定义子组件？
- [ ] 大列表已虚拟化、重模块已懒加载？
- [ ] 外部 store 订阅最小 slice、selector 稳定、必要时 shallowEqual？
- [ ] Context value 已 useMemo 稳定？
- [ ] 优化前后有可对比数据（commit time / latency / bundle size）？

## 反模式速查
完整反模式（父破坏 memo、render 内 mutate、吃整份 store、selector 返新对象、Context value 不稳）见 [advanced.md](./advanced.md#anti-patterns)。
