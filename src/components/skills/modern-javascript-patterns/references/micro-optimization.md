# JavaScript 微优化模式

热路径性能优化的详细代码模式与检查清单。核心约束已在 SKILL.md 中列出。

## 代码模式

### Set/Map 做 O(1) 查找

```typescript
// FAIL — O(n) 查找，大数组时变慢
const allowedIds = ['a', 'b', 'c', ...];
items.filter(item => allowedIds.includes(item.id));

// PASS — O(1) 查找
const allowedIds = new Set(['a', 'b', 'c', ...]);
items.filter(item => allowedIds.has(item.id));
```

### flatMap 合并遍历

```typescript
// FAIL — 遍历两次
const active = users.map(u => u.name).filter(n => n.length > 0);

// PASS — 一次遍历
const active = users.flatMap(u => u.name.length > 0 ? [u.name] : []);
```

### toSorted 保持不可变

```typescript
// FAIL — sort() 原地修改，破坏不可变性
const sorted = items.sort((a, b) => a.value - b.value);

// PASS — toSorted() 返回新数组
const sorted = items.toSorted((a, b) => a.value - b.value);
```

### reduce 取 max/min（避免 sort）

```js
const max = items.reduce((m, x) => x.value > m.value ? x : m, items[0]);
// O(n) + 不修改原数组，优于 sort()[0] 的 O(n log n)
```

### RegExp 提升到循环外部

```js
const re = new RegExp(`^${prefix}_`);
for (const item of items) {
  if (re.test(item.name)) { ... }
}
// 编译一次，循环复用
```

### DOM 先读后写

```js
const heights = items.map(i => i.element.offsetHeight);  // 批量读
items.forEach((i, idx) => {
  i.element.style.top = `${heights[idx]}px`;  // 批量写
});
// 避免 layout thrashing
```

## 检查清单

- [ ] 先用 Profiler 确认热路径位置？
- [ ] 重复查找是否已替换为 Set/Map？
- [ ] 多次数组遍历是否合并为一次？
- [ ] RegExp 是否提升到循环外部？
- [ ] DOM 读写是否先批量读再批量写？
- [ ] 非关键计算是否用 requestIdleCallback 延迟？

## 规则文件索引

详细的单条规则与反模式：

- [js-set-map-lookups.md](./micro-optimization-rules/js-set-map-lookups.md)
- [js-index-maps.md](./micro-optimization-rules/js-index-maps.md)
- [js-combine-iterations.md](./micro-optimization-rules/js-combine-iterations.md)
- [js-flatmap-filter.md](./micro-optimization-rules/js-flatmap-filter.md)
- [js-early-exit.md](./micro-optimization-rules/js-early-exit.md)
- [js-cache-function-results.md](./micro-optimization-rules/js-cache-function-results.md)
- [js-cache-property-access.md](./micro-optimization-rules/js-cache-property-access.md)
- [js-cache-storage.md](./micro-optimization-rules/js-cache-storage.md)
- [js-hoist-regexp.md](./micro-optimization-rules/js-hoist-regexp.md)
- [js-batch-dom-css.md](./micro-optimization-rules/js-batch-dom-css.md)
- [js-request-idle-callback.md](./micro-optimization-rules/js-request-idle-callback.md)
- [js-length-check-first.md](./micro-optimization-rules/js-length-check-first.md)
- [js-min-max-loop.md](./micro-optimization-rules/js-min-max-loop.md)
- [js-tosorted-immutable.md](./micro-optimization-rules/js-tosorted-immutable.md)
