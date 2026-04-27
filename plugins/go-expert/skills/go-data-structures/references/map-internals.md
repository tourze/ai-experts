# Map 内部机制

## 哈希表结构

Go map 底层是哈希表，核心结构：

```
hmap
├── count     int     // 元素总数（len() 返回值）
├── B         uint8   // 桶数量 = 2^B
├── buckets   *bmap   // 桶数组指针
└── oldBuckets *bmap  // 扩容时指向旧桶（迁移完成后置 nil）
```

每个桶（`bmap`）包含：

- **8 个键值对槽位** — 定长，减少内存碎片
- **8 byte tophash 数组** — 存储每个 key 哈希值的高 8 位，用于快速过滤
- **溢出桶指针** — 当桶满 8 个后链式挂载溢出桶

查找流程：
1. 计算 key 哈希值
2. 用低 B 位定位桶
3. 用 tophash 快速比对（避免逐个比较完整 key）
4. tophash 命中后再做完整 key 比较

## 引用类型语义

```go
m1 := make(map[string]int)
m1["a"] = 1
m2 := m1       // m1 和 m2 指向同一个 hmap
m2["b"] = 2    // m1["b"] 也是 2
```

- map 变量本身是指针，赋值/传参/作为返回值都是浅拷贝。
- `make(map[K]V)` 返回 `*hmap`，`nil map` 指针为零值。
- `nil map` 读取返回零值，**写入 panic**。

## Map 不缩容

这是 Go map 最容易被忽略的特性：

- **删除 key 只标记 tophash 为 `emptyOne`/`emptyRest`，不释放桶内存。**
- 即使删掉所有 key，桶和溢出桶仍驻留在堆上。
- 扩容时最多做等量扩容（整理溢出桶），桶数不会减少。

**解决方案**：大量删除后，重建新 map：

```go
// 大批量删除后释放内存
old := m
m = make(map[K]V, len(old)/4) // 按需预估新容量
for k, v := range old {
    if shouldKeep(k) {
        m[k] = v
    }
}
old = nil // 帮助 GC 回收旧 hmap
```

## 预分配

```go
// 大小已知时预分配，避免多次扩容
m := make(map[string]int, 1000)
```

预分配只影响初始桶数（B 值），对齐到 2 的幂。例如 `make(map[K]V, 13)` 实际分配 16 个桶（B=4）。

## maps 包（Go 1.21+）

| 函数 | 用途 |
|------|------|
| `maps.Keys(m)` | 返回所有 key 的切片（顺序随机） |
| `maps.Values(m)` | 返回所有 value 的切片 |
| `maps.Clone(m)` | 浅拷贝 map |
| `maps.Equal(m1, m2)` | 比较两个 map 是否完全相同 |
| `maps.EqualFunc(m1, m2, eq)` | 自定义 value 比较函数 |
| `maps.Insert(m, iter)` | 从迭代器插入键值对（Go 1.23+） |
| `maps.Collect(iter)` | 从迭代器收集为 map（Go 1.23+） |

### 常用示例

```go
// 克隆
m2 := maps.Clone(m1)

// 提取 keys
keys := maps.Keys(config) // []K，无序

// 比较
if !maps.Equal(got, want) {
    t.Errorf("map mismatch")
}
```

## 遍历随机性

Go map 遍历顺序是**刻意随机化的**（runtime 在开始 range 时随机选择起始桶和桶内偏移）。

- 不要依赖遍历顺序；需要有序遍历时先提取 key 再排序。
- 多次遍历同一 map，顺序可能不同。

```go
keys := maps.Keys(m)
slices.Sort(keys)
for _, k := range keys {
    fmt.Println(k, m[k])
}
```
