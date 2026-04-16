---
name: js-micro-optimization
description: 当需要优化 JavaScript 热路径性能、减少不必要的迭代和查找、或改善 DOM 操作效率时使用。用户提到 JS 性能、热路径优化、Set/Map 查找、循环优化、DOM 批处理、requestIdleCallback 时触发。
---

# JavaScript 微优化

## 适用场景

- 热路径代码存在 O(n²) 查找、重复迭代或冗余计算。
- 需要把 Array.includes 替换为 Set.has 做 O(1) 查找。
- 需要合并多次数组遍历为一次、用 flatMap 替代 map+filter。
- 需要避免 DOM 读写交替造成的 layout thrashing。
- 需要用 requestIdleCallback 延迟非关键计算。
- 这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。

## 核心约束

- 微优化只在热路径上有意义 — 先用 Profiler 确认瓶颈再动手。
- 优化不能牺牲可读性，除非性能收益可测量。
- 优先选择语义更清晰的 API（toSorted 优于手动 copy+sort）。
- DOM 批处理必须先读后写，不能读写交替。

## 代码模式

```typescript
// FAIL — O(n) 查找，大数组时变慢
const allowedIds = ['a', 'b', 'c', ...];
items.filter(item => allowedIds.includes(item.id));
```

```typescript
// PASS — O(1) 查找
const allowedIds = new Set(['a', 'b', 'c', ...]);
items.filter(item => allowedIds.has(item.id));
```

```typescript
// FAIL — 遍历两次
const active = users.map(u => u.name).filter(n => n.length > 0);
```

```typescript
// PASS — 一次遍历
const active = users.flatMap(u => u.name.length > 0 ? [u.name] : []);
```

```typescript
// FAIL — sort() 原地修改，破坏不可变性
const sorted = items.sort((a, b) => a.value - b.value);
```

```typescript
// PASS — toSorted() 返回新数组
const sorted = items.toSorted((a, b) => a.value - b.value);
```

```md
规则文件索引：
- [rules/js-set-map-lookups.md](rules/js-set-map-lookups.md)
- [rules/js-index-maps.md](rules/js-index-maps.md)
- [rules/js-combine-iterations.md](rules/js-combine-iterations.md)
- [rules/js-flatmap-filter.md](rules/js-flatmap-filter.md)
- [rules/js-early-exit.md](rules/js-early-exit.md)
- [rules/js-cache-function-results.md](rules/js-cache-function-results.md)
- [rules/js-cache-property-access.md](rules/js-cache-property-access.md)
- [rules/js-cache-storage.md](rules/js-cache-storage.md)
- [rules/js-hoist-regexp.md](rules/js-hoist-regexp.md)
- [rules/js-batch-dom-css.md](rules/js-batch-dom-css.md)
- [rules/js-request-idle-callback.md](rules/js-request-idle-callback.md)
- [rules/js-length-check-first.md](rules/js-length-check-first.md)
- [rules/js-min-max-loop.md](rules/js-min-max-loop.md)
- [rules/js-tosorted-immutable.md](rules/js-tosorted-immutable.md)
```

## 检查清单

- [ ] 是否先用 Profiler 确认了热路径位置？
- [ ] 重复查找是否已替换为 Set/Map？
- [ ] 多次数组遍历是否合并为一次？
- [ ] RegExp 是否提升到循环外部？
- [ ] DOM 读写是否先批量读再批量写？
- [ ] 非关键计算是否用 requestIdleCallback 延迟？

## 反模式

### FAIL: sort 取 max

```js
const max = items.sort((a, b) => b.value - a.value)[0];
// O(n log n) + 修改原数组
```

### PASS: 一次循环

```js
const max = items.reduce((m, x) => x.value > m.value ? x : m, items[0]);
// O(n) + 不修改原数组
```

### FAIL: 循环内 new RegExp

```js
for (const item of items) {
  if (new RegExp(`^${prefix}_`).test(item.name)) { ... }
}
// 每次循环重新编译正则
```

### PASS: 提升到外面

```js
const re = new RegExp(`^${prefix}_`);
for (const item of items) {
  if (re.test(item.name)) { ... }
}
// 编译一次，循环复用
```

### FAIL: DOM 读写交替

```js
items.forEach(item => {
  const h = item.element.offsetHeight;  // 读（强制 layout）
  item.element.style.top = `${h}px`;    // 写
  // 下次循环又读 → 再次强制 layout
});
```

### PASS: 先读后写

```js
const heights = items.map(i => i.element.offsetHeight);  // 批量读
items.forEach((i, idx) => {
  i.element.style.top = `${heights[idx]}px`;  // 批量写
});
// 一次 layout
```
