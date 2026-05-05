# Slice 内部机制

## Slice Header

slice 是一个包含 3 个字段的结构（占用 3 个 machine word）：

```go
type slice struct {
    array unsafe.Pointer // 指向底层数组的指针
    len   int            // 当前元素数量
    cap   int            // 底层数组总容量
}
```

赋值/传参复制的是 header，底层数组（backing array）始终共享。

## 容量增长算法

`append` 触发扩容时的精确算法（`runtime.growslice`）：

1. **期望容量** = `max(2 * old.cap, newLen)`
2. **如果 old.cap < 256**：新 cap = 旧 cap * 2（翻倍）
3. **如果 old.cap >= 256**：新 cap = `old.cap + (old.cap + 3*256) / 4`（约 1.25x + 192）
4. 最终对齐到 `spanClass` 大小级别（8/16/32...字节）

示例增长序列（从 cap=0 开始 append）：

```
0 → 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128 → 256 → 512 → 832 → 1280 → ...
```

> 256 之后不再是翻倍，增长放缓。

## 预分配模式

### 精确大小已知

```go
// 已知元素数量
s := make([]T, 0, n)
for i := 0; i < n; i++ {
    s = append(s, compute(i))
}
```

### 近似大小

```go
// 大致知道范围，预留余量
s := make([]T, 0, estimatedSize*2)
```

### slices.Grow（Go 1.21+）

```go
import "slices"

// 追加前确保至少有 n 个空位，不改变 len
s = slices.Grow(s, n)
```

## slices 包关键函数（Go 1.21+）

| 函数 | 用途 |
|------|------|
| `slices.Sort(s)` | 原地排序（pdqsort） |
| `slices.SortFunc(s, cmp)` | 自定义比较排序 |
| `slices.BinarySearch(s, target)` | 二分查找返回 (index, found) |
| `slices.Contains(s, val)` | 线性包含检查 |
| `slices.Compact(s)` | 原地去重相邻重复元素（先 Sort 再 Compact 去重） |
| `slices.CompactFunc(s, eq)` | 自定义等价比较去重 |
| `slices.Delete(s, i, j)` | 删除 [i, j) 并保持顺序 |
| `slices.Insert(s, i, vals...)` | 在索引 i 处插入元素 |
| `slices.Clone(s)` | 浅拷贝底层数组 |
| `slices.Reverse(s)` | 原地反转 |
| `slices.Min/Max(s)` | 最小/最大值 |
| `slices.IsSorted(s)` | 是否已排序 |

## Backing Array 别名

### 什么情况会共享

```go
a := []int{1, 2, 3, 4, 5}
b := a[1:3]    // b 和 a 共享底层数组
b[0] = 99      // a[1] 也变成 99
```

### 三索引切片切断容量共享

```go
b := a[1:3:3]  // len=2, cap=2，append 时会分配新数组
```

### 何时必须注意

1. **函数返回内部 slice** — 调用方修改会污染内部状态，应用 `copy` 或 `slices.Clone`。
2. **reslice 后 append** — append 覆盖原数组中超出 len 但在 cap 内的元素。
3. **string ↔ []byte 转换** — 零拷贝转换（`unsafe`）后修改 byte 会破坏字符串不可变语义。

### 安全复制

```go
// Go 1.21+
dst := slices.Clone(src)

// 旧版本
dst := make([]T, len(src))
copy(dst, src)
```
