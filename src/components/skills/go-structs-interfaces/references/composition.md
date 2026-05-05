# 结构体组合与 Embedding 参考

## Embedding vs 命名字段

Embedding 将内层类型的方法提升到外层类型，调用方可直接调用。

```go
type Server struct {
    mu sync.Mutex // 命名字段：需显式 s.mu.Lock()
}
type SafeServer struct {
    sync.Mutex // 嵌入：直接 s.Lock()
}
```

### 何时 Embed

- 想暴露被嵌入类型的方法。
- 接口满足：嵌入 `io.Reader` 让外层自动满足 `io.Reader`。
- `sync.Mutex` 嵌入实现零值可用 + `Lock`/`Unlock` 直接调用。

### 何时用命名字段

- 不想暴露内部方法。
- 需要多个同类型字段。
- 表达"拥有"而非"是"的关系。

## 方法提升规则

| 嵌入方式 | 外层值类型可调用 | 外层指针类型可调用 |
|----------|------------------|---------------------|
| 值嵌入 `T` | T 的值方法 | T 的值方法 + 指针方法 |
| 指针嵌入 `*T` | 编译错误 | T 的值方法 + 指针方法 |

外层类型可覆盖提升方法，仍可通过 `s.Inner.Method()` 调用原始方法。

## 接口组合

大接口由小接口组合，不要在一个接口堆 10 个方法：

```go
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }
type ReadWriter interface { Reader; Writer }
```

消费方按需取最小子集。

## 菱形问题规避

Go 不允许多重嵌入同名方法，编译器直接报错：

```go
type A struct{ x int }
func (A) Get() int { return 0 }
type B struct{ x int }
func (B) Get() int { return 0 }
// 编译错误：ambiguous selector C.Get
type C struct { A; B }
```

解决：将至少一个改为命名字段，显式 `c.A.Get()`。

## Embedding 不是继承

Embedding 是组合 + 方法提升，不提供 IS-A 多态分派。方法提升是语法糖，不是虚函数分派。需要多态行为时使用接口。

## noCopy 与零值可用

内嵌 `sync.Mutex` 使 `go vet` 检测非法复制：

```go
type Counter struct {
    mu    sync.Mutex // 零值即未锁定
    count int64      // 零值为 0
}
```

无法零值可用时，注释标注：`// MUST be initialized with NewX().`

## 编译期接口检查

```go
var _ io.Reader = (*MyReader)(nil) // 不分配，编译时验证
```

## Receiver 速查

| 场景 | Receiver | 原因 |
|------|----------|------|
| 需修改状态 | `*T` | 值 receiver 操作副本 |
| 结构体 > 64 字节 | `*T` | 避免拷贝 |
| 含不可复制字段 | `*T` | noCopy |
| 小型不可变值 | `T` | 值语义 |
| 不确定 | `*T` | 后续扩展不影响调用方 |

同一类型所有方法 receiver 必须一致。
