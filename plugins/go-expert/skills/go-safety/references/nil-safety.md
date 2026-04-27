# Go nil 安全深度参考

## 接口 nil 陷阱

Go 的 interface 内部由两个字段组成：**类型指针** 和 **值指针**。只有两者都为 nil 时，接口才等于 nil。

### typed nil 不是 nil

```go
type MyError struct{ Msg string }
func (e *MyError) Error() string { return e.Msg }

var e error           // 类型指针 = nil, 值指针 = nil → e == nil ✓
var e error = (*MyError)(nil)  // 类型指针 = *MyError, 值指针 = nil → e != nil ✗
```

`(*MyError)(nil)` 创建了一个携带具体类型、值为 nil 的接口。`if e != nil` 会判定为非 nil，即使底层值确实是 nil。

### 陷阱复现场景

```go
func getErr() error {
    var err *MyError  // nil 指针
    return err        // 隐式包装为 interface，类型不为 nil
}

func main() {
    if err := getErr(); err != nil {
        fmt.Println("出错了") // 会执行！即使值是 nil
    }
}
```

函数返回值为 `error` 接口类型，`nil *MyError` 被隐式包装为 typed nil。

### 正确模式：先检查具体类型

```go
func getErr() error {
    var err *MyError
    if err != nil {
        return err  // 只有非 nil 才返回
    }
    return nil      // 返回真正的 nil interface
}
```

或者显式返回 nil：

```go
func getErr() error {
    var err *MyError = nil
    if err != nil {
        return err
    }
    return nil  // 零值 error，类型和值都为 nil
}
```

### 接口 nil 判定规则

| 表达式 | 类型指针 | 值指针 | `== nil` | 说明 |
|--------|---------|--------|----------|------|
| `var e error` | nil | nil | true | 零值接口 |
| `var e error = (*T)(nil)` | `*T` | nil | false | typed nil |
| `var e error = nil` | nil | nil | true | 显式 nil |
| `var e error = error(nil)` | nil | nil | true | 类型转换 nil |

## nil 切片 vs 空切片

### 行为对比

| 操作 | nil 切片 `var s []int` | 空切片 `s := []int{}` | 说明 |
|------|----------------------|---------------------|------|
| `len(s)` | 0 | 0 | 相同 |
| `cap(s)` | 0 | 0 | 相同 |
| `for range s` | 不执行 | 不执行 | 相同 |
| `s[i]` | panic | panic | 相同 |
| `append(s, x)` | 正常 | 正常 | 相同 |
| `json.Marshal(s)` | `null` | `[]` | **不同** |
| `reflect.DeepEqual(nil, []int{})` | — | false | **不同** |

### JSON 序列化场景

```go
var s1 []string         // nil
var s2 = []string{}     // 空

b1, _ := json.Marshal(map[string]any{"items": s1})  // {"items":null}
b2, _ := json.Marshal(map[string]any{"items": s2})  // {"items":[]}
```

前端约定：`null` 表示"未设置"或"不存在"，`[]` 表示"有这个字段但为空"。API 设计时应明确选择。

### 推荐做法

```go
// 返回空集合给前端时，用空切片而非 nil
func ListItems() []Item {
    items, err := db.Query()
    if err != nil {
        return []Item{}  // JSON: []
    }
    return items  // 如果 db 返回 nil，JSON: null
}

// 延迟初始化场景，nil 切片更合适
var cache []Entry  // append 时自动分配
```

## 零值可用设计

Go 惯例：结构体的零值应该可以直接使用，无需构造函数。

### 正确示例

```go
// sync.Mutex 零值即可用，不需要 NewMutex()
var mu sync.Mutex
mu.Lock()
defer mu.Unlock()

// bytes.Buffer 零值即可用
var buf bytes.Buffer
buf.WriteString("hello")

// 合理设计：零值有意义的结构体
type Server struct {
    Addr string  // "" 表示使用默认地址
    Port int     // 0 表示使用默认端口
}
```

### 反模式

```go
type Config struct {
    Timeout time.Duration  // 0 表示"无超时"还是"未设置"？歧义
    Retries int            // 0 表示"不重试"还是"未设置"？歧义
}

// 改进：用指针或明确语义
type Config struct {
    Timeout *time.Duration  // nil 表示未设置
    Retries int             // 0 明确表示不重试
}
```

### 零值可用 checklist

1. 零值不会 panic 或产生错误行为
2. 零值语义明确，不产生歧义
3. 文档中说明零值的含义
4. 如果零值无法满足"可用"，提供 `NewXxx()` 构造函数

## 常见 nil 检查模式

```go
// 错误返回：返回 nil 而非 typed nil
func Find(id int) (*Item, error) {
    item := lookup(id)
    if item == nil {
        return nil, nil  // 不要 return item, nil（item 是 typed nil）
    }
    return item, nil
}

// 接口断言后检查 nil
var w io.Writer = getWriter()
if rc, ok := w.(io.ReadCloser); ok && rc != nil {
    rc.Close()
}

// map 值检查：零值类型不等于"存在"
m := map[string]*Item{"a": nil}
if v, ok := m["a"]; ok {
    // ok == true，但 v == nil
    // key 存在但值为 nil，需要额外判断
}
```
