# 标识符命名详细规则

## 作用域命名

短作用域用短名称，长作用域用描述性名称。

```go
// 好：3 行循环，i 足够
for i := range items {
    fmt.Println(i)
}

// 好：跨多行逻辑，用描述性名称
bestScore := math.MinInt
for _, result := range results {
    if result.Score > bestScore {
        bestScore = result.Score
    }
}
```

## Receiver 命名

- 1-2 个字母，通常是类型名首字母。
- 同一类型的所有方法必须用相同的 receiver 名。

```go
type Server struct { /* ... */ }

func (s *Server) Start() error { /* ... */ }
func (s *Server) Stop()        error { /* ... */ }
// 不要写成 (srv *Server) 或 (server *Server)
```

| 类型 | Receiver |
|------|----------|
| `Client` | `c` |
| `Server` | `s` |
| `Buffer` | `b` |
| `Encoder` | `e` |

避免使用 `me`、`this`、`self`。

## 测试命名

- 测试函数：`Test<功能>_<场景>_<期望结果>`，用下划线（唯一允许下划线的地方）。
- Benchmark：`Benchmark<功能>`。
- Example：`Example<类型>_<方法>`。

```go
func TestServer_Start_Timeout(t *testing.T) { /* ... */ }
func BenchmarkServer_Start(b *testing.B)    { /* ... */ }
func ExampleServer_Start()                  { /* ... */ }
```

## 缩写大小写规则

缩写词（acronym）要么全大写，要么全小写，不要混用。

| 缩写 | 导出 | 未导出 |
|------|------|--------|
| URL | `URL` | `url` |
| HTTP | `HTTPServer` | `httpServer` |
| ID | `UserID` | `userID` |
| XML | `XMLParser` | `xmlParser` |
| JSON | `JSONResponse` | `jsonResponse` |
| TCP | `TCPConn` | `tcpConn` |
| API | `APIClient` | `apiClient` |

反面示例：`Url`、`HttpServer`、`UserId`、`jsonData`（应 `JSONData` 导出时）。

## 包名选择

- 单个小写单词，不包含下划线或驼峰。
- 不用复数：`strings` 是标准库例外，新包避免。
- 不用 `utils`、`helpers`、`common`、`base`——改用具体功能命名。
- 包名应描述内容，不是来源：`user` 非 `usermodel`。

```go
// 好
package tokenizer
package ratelimit

// 坏
package utils
package myPackage
package user_service
```

## Getter / Setter

Go 不加 `Get`/`Set` 前缀。Setter 可用 `Set` 前缀。

```go
// Getter：不加 Get
func (u *User) Name() string { return u.name }

// Setter：可加 Set
func (u *User) SetName(name string) { u.name = name }
```

## 接口命名

- 单方法接口：方法名 + `er` 后缀。
- 多方法接口：用描述行为的名词。
- 接口定义在消费方，不在实现方。

```go
type Reader interface { Read(p []byte) (int, error) }
type Writer interface { Write(p []byte) (int, error) }
type ReadWriter interface { Reader; Writer }  // 组合
type SessionManager interface { /* 多方法 */ }
```
