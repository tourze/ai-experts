# Go 精简模式

## 目录

1. [错误处理](#错误处理)
2. [结构模式](#结构模式)
3. [接口设计](#接口设计)
4. [并发](#并发)
5. [反模式](#反模式)

---

## 错误处理

### 包裹错误并附加上下文

```go
// 改造前
if err != nil {
    return err
}

// 改造后——附加调试用的上下文
if err != nil {
    return fmt.Errorf("parsing config %s: %w", path, err)
}
```

### 哨兵错误用于预期条件

```go
var ErrNotFound = errors.New("record not found")

// 调用方通过 errors.Is 检查：
if errors.Is(err, ErrNotFound) { ... }
```

### 错误类型断言

```go
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    log.Printf("failed path: %s", pathErr.Path)
}
```

### 不要既打日志又返回错误

要么记录错误（如果你是最上层处理者），要么返回错误（如果你是库）。永远不要两者都做——会产生重复噪音。

---

## 结构模式

### 表驱动测试

用测试表替代重复的测试函数：

```go
tests := []struct {
    name     string
    input    string
    expected int
    wantErr  bool
}{
    {"empty", "", 0, true},
    {"valid", "42", 42, false},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        got, err := Parse(tt.input)
        if (err != nil) != tt.wantErr {
            t.Errorf("unexpected error: %v", err)
        }
        if got != tt.expected {
            t.Errorf("got %d, want %d", got, tt.expected)
        }
    })
}
```

### 函数选项模式

用函数选项替代大型配置结构体来处理可选配置：

```go
type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func NewServer(opts ...Option) *Server {
    s := &Server{port: 8080} // 合理的默认值
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

### 卫语句

与其他语言相同的原则——提前退出，让主路径保持在最低缩进级：

```go
func (s *Service) Process(ctx context.Context, req *Request) error {
    if req == nil {
        return errors.New("nil request")
    }
    if err := req.Validate(); err != nil {
        return fmt.Errorf("invalid request: %w", err)
    }
    // 主路径在缩进第 1 级
    return s.store.Save(ctx, req)
}
```

---

## 接口设计

### 接受接口，返回结构体

函数应接受所需的最窄接口，返回具体类型。

### 小接口

优先使用 1-2 个方法的接口。从小接口组合出更大的行为。

```go
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }
type ReadWriter interface { Reader; Writer }
```

### 在消费方定义接口

*使用*接口的包来定义接口，而非实现接口的包。这保持依赖单向流动。

---

## 并发

### 并行工作带错误收集用 `errgroup`

```go
g, ctx := errgroup.WithContext(ctx)
for _, url := range urls {
    g.Go(func() error {
        return fetch(ctx, url)
    })
}
if err := g.Wait(); err != nil {
    return err
}
```

### 库代码中不要在无生命周期控制的情况下启动 goroutine

如果必须启动，接受 context 和/或返回清理函数。

### Channel 方向注解

```go
func producer(ch chan<- int) { ... }  // 只发送
func consumer(ch <-chan int) { ... }  // 只接收
```

---

## 反模式

| 反模式 | 修复方案 |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `init()` 中有副作用 | 移到显式初始化函数 |
| 包级 `var` 用于可变状态 | 显式传递依赖 |
| 具体类型已知却用 `interface{}` / `any` | 使用具体类型或受限泛型 |
| 库代码中 panic | 返回错误 |
| 用 `_` 忽略错误 | 处理或包裹。如果确实可忽略，加注释说明原因 |
| `sync.Mutex` 仅保护单个字段 | 考虑 `atomic` 类型 |
| 用 Channel 做简单互斥 | 使用 `sync.Mutex` |
| 深层嵌套的 `if err != nil` 链 | 提取辅助函数，使用命名返回值 |
