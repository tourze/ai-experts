## 核心约束

| 约束 | 说明 |
|------|------|
| 预分配 | 大小已知时用 `make([]T, 0, n)` 或 `make(map[K]V, n)` |
| slice 增长 | cap < 256 翻倍；cap >= 256 按 `1.25x + 192` 增长 |
| array | 仅编译期已知大小时使用；函数参数会复制整个数组 |
| map 不缩容 | 大量删除后应替换为新 map，否则内存不释放 |
| strings.Builder | 拼接字符串；`defer b.Reset()` 复用 |
| bytes.Buffer | 双向 I/O；内容可变，`b.Bytes()` 返回内部切片需注意别名 |
| 泛型约束 | 使用最严格约束：`comparable` > `cmp.Ordered` > `any` |
| unsafe.Pointer | 仅允许 6 种合法转换模式（见 spec） |
| weak.Pointer[T] | Go 1.24+，缓存场景替代 `runtime.SetFinalizer` |
| container/heap | 实现优先队列；需实现 `heap.Interface` |
| container/list | 双向链表，适合 LRU；零值即可用 |
| container/ring | 环形缓冲区；固定大小轮转 |

## 常见错误

| 错误 | 修复 |
|------|------|
| `append` 后未接收返回值 | `s = append(s, x)` 始终赋值回原变量 |
| 共享 backing array 导致数据污染 | 需隔离时用 `copy` 或三索引切片 `s[:n:n]` |
| map 并发读写 panic | 单协程写 + `sync.RWMutex` 读，或用 `sync.Map`（高读低写场景） |
| `range` 循环变量复用导致闭包捕获错误 | Go 1.22+ 已修复；旧版本需 `v := v` |
| 对大 map 大量删除后期望内存释放 | 删除后重建 `make(map[K]V)` |
| `unsafe.Pointer` 跳过中间变量 | 违反 spec 6 种模式，GC 可能出错 |
| 泛型约束写 `any` 但实际只需 `comparable` | 缩窄约束提升类型安全 |

## Copy 语义速查

| 类型 | 赋值复制内容 | 底层数据共享 |
|------|-------------|-------------|
| array | 整个数组值 | 否 |
| slice | header（ptr/len/cap） | 是（backing array） |
| map | 指针 | 是 |
| channel | 指针 | 是 |
| string | header（ptr/len） | 是（不可变，安全） |
| struct | 逐字段复制 | 值类型否；引用字段是 |

## 深度参考

- [slice-internals.md](references/slice-internals.md) — header 结构、增长算法、预分配、`slices` 包、别名陷阱
- [map-internals.md](references/map-internals.md) — 哈希桶、扩容、不缩容、`maps` 包
