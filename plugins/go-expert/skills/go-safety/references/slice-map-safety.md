# Go 切片与 Map 安全深度参考

## 切片头部与赋值语义

切片头部是一个包含三个字段的结构体：

```
type slice struct {
    ptr *array  // 指向底层数组的指针
    len int     // 当前长度
    cap int     // 容量
}
```

**赋值复制的是头部，不复制底层数组。** 两个切片变量可能共享同一块内存。

```go
a := []int{1, 2, 3, 4, 5}
b := a[1:3]       // b 的 ptr 指向 a[1]，共享底层数组
b[0] = 99         // a[1] 也变成了 99
```

## append 别名陷阱

### 问题描述

当 append 未触发扩容时，新切片与旧切片共享底层数组。写入可能覆盖另一方的数据。

```go
a := make([]int, 3, 6)  // len=3, cap=6
a[0], a[1], a[2] = 1, 2, 3

b := append(a, 4)  // 未扩容，b 与 a 共享底层数组
b[0] = 99

fmt.Println(a[0])  // 99 — a 的数据被修改了
```

### reslice 后 append 的隐蔽问题

```go
data := []int{1, 2, 3, 4, 5}
tail := data[2:]   // tail = [3, 4, 5], cap=3

// 如果 data 的 cap 足够，append 会覆盖 data 的尾部
```

### 防御模式对比

| 模式 | 代码 | 适用场景 |
|------|------|---------|
| `make` + `copy` | `b := make([]T, len(a)); copy(b, a)` | Go 所有版本 |
| `slices.Clone` | `b := slices.Clone(a)` | Go 1.21+ |
| 三索引切片 | `b := a[2:4:4]` | 限制 cap 防止 append 覆盖 |

### 推荐做法

```go
// Go 1.21+：使用 slices.Clone
import "slices"

a := []int{1, 2, 3}
b := slices.Clone(a)  // 真正独立副本
b[0] = 99
fmt.Println(a[0])     // 1 — a 不受影响

// Go 1.21 以下：make + copy
b := make([]int, len(a))
copy(b, a)

// 三索引切片：限制容量防止 append 污染
data := []int{1, 2, 3, 4, 5}
sub := data[1:3:3]  // len=2, cap=2，append 必然扩容
_ = append(sub, 99) // 新分配，不影响 data
```

## 函数参数中的切片

```go
// 危险：修改可能影响调用方
func addElement(s []int, v int) []int {
    return append(s, v)  // 如果 s 有剩余 cap，会修改原切片
}

// 安全：不修改原切片
func addElementSafe(s []int, v int) []int {
    cp := slices.Clone(s)
    return append(cp, v)
}
```

## Map 是引用类型

### 赋值复制的是指针

```go
m1 := map[string]int{"a": 1}
m2 := m1        // m1 和 m2 指向同一个 hashmap
m2["b"] = 2
fmt.Println(m1["b"])  // 2 — m1 也被修改
```

Map 变量本质是 `*runtime.hmap` 的指针。赋值、传参、作为返回值都是指针拷贝。

### Map 永不缩容

Map 在删除大量 key 后，bucket 内存不会释放。如果曾经膨胀到很大，即使 key 全部删除，内存占用仍然很高。

```go
// 场景：缓存 periodically flush
cache := make(map[string]Entry)
for range ticker.C {
    // 只删除 key，内存不会缩回来
    for k := range cache {
        delete(cache, k)
    }
}

// 改进：替换整个 map
for range ticker.C {
    cache = make(map[string]Entry)  // 旧 map 被 GC 回收
}
```

### 并发不安全

Map 不是并发安全的。并发读写会 panic（`fatal error: concurrent map writes`），不是普通的 panic，无法 recover。

```go
// 危险：并发写入
var m = make(map[string]int)
// goroutine 1
m["a"] = 1
// goroutine 2
m["b"] = 2  // 可能触发 fatal error

// 解决方案一：sync.RWMutex
var (
    mu sync.RWMutex
    m  = make(map[string]int)
)
func Set(k string, v int) {
    mu.Lock()
    defer mu.Unlock()
    m[k] = v
}
func Get(k string) int {
    mu.RLock()
    defer mu.RUnlock()
    return m[k]
}

// 解决方案二：sync.Map（读多写少场景）
var m sync.Map
m.Store("a", 1)
v, ok := m.Load("a")
```

### map 零值是 nil

```go
var m map[string]int  // nil map
m["a"] = 1            // panic: assignment to entry in nil map
```

正确做法：

```go
var m = make(map[string]int)  // 空但可用
m["a"] = 1                    // OK
```

## 切片与 Map 的比较

切片和 map 不能直接用 `==` 比较（`[]int == []int` 编译错误、`map == map` 编译错误）。

| 方法 | 代码 | 版本要求 |
|------|------|---------|
| `reflect.DeepEqual` | `reflect.DeepEqual(a, b)` | 所有版本 |
| `slices.Equal` | `slices.Equal(a, b)` | Go 1.21+ |
| `maps.Equal` | `maps.Equal(a, b)` | Go 1.21+ |

```go
import (
    "slices"
    "maps"
)

// 切片比较
a := []int{1, 2, 3}
b := []int{1, 2, 3}
fmt.Println(slices.Equal(a, b))  // true

// Map 比较
m1 := map[string]int{"a": 1}
m2 := map[string]int{"a": 1}
fmt.Println(maps.Equal(m1, m2))  // true
```

### nil 与空的比较

```go
var s1 []int           // nil
var s2 = []int{}       // 空
slices.Equal(s1, s2)   // true — 值相等

var m1 map[string]int  // nil
var m2 = map[string]int{} // 空
maps.Equal(m1, m2)     // true — 值相等
```

`slices.Equal` 和 `maps.Equal` 对 nil 与空视为相等。如果需要区分 nil 和空，仍需额外判断。
