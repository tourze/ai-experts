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

- 在冷路径上做微优化，增加复杂度但用户无感知。
- 用 Array.sort() 只为了取最大/最小值，一次循环就够。
- 在循环内每次 new RegExp，重复编译正则。
- DOM 操作读写交替，触发多次强制布局。
