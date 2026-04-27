---
name: go-naming
description: 当 Go 代码需要命名判断：包名、构造器、接口、错误、布尔字段、常量、缩写、枚举零值或 import alias 时使用。
---

# go-naming

## 适用场景

- 需要给包、类型、函数、变量、常量、错误值命名或审查命名。
- 需要决定构造器、接口、receiver、functional option 的命名方式。
- 需要处理缩写大小写（URL、HTTP、ID 等）。

涉及错误语义和错误包装时配合 [go-error-handling](../go-error-handling/SKILL.md)；涉及代码风格和函数签名时配合 [go-code-style](../go-code-style/SKILL.md)。

## 核心约束

| 类别 | 规则 | 示例 |
|------|------|------|
| 通用 | MixedCaps，不用下划线（测试函数除外） | `maxRetry`, `httpClient` |
| 消除重复 | 包名已在上下文中，不要再重复 | `http.Client` 非 `http.HTTPClient` |
| 包名 | 单个小写单词，不用复数/utils/helpers | `encoding/json`, `net/http` |
| 导出类型 | 名词或名词短语 | `Buffer`, `Reader` |
| 构造器 | 单类型用 `New`，多类型用 `NewTypeName` | `New()`, `NewTimer()` |
| 接口 | 单方法加 `-er` 后缀 | `Reader`, `Stringer` |
| Receiver | 1-2 字母缩写，整个类型保持一致 | `func (c *Client)` |
| 布尔字段 | 可加 `Is`/`Has`/`Can` 前缀提升可读性 | `IsActive`, `HasPermission` |
| 错误变量 | `Err` 前缀 | `ErrNotFound` |
| 错误类型 | `Error` 后缀 | `SyntaxError` |
| 错误字符串 | 全小写（含缩写），无标点收尾 | `"http request failed"` |
| 缩写 | 全大写或全小写，不混用 | `URL`, `httpServer` 非 `Url` |
| 枚举零值 | `Unknown`/`Invalid` 放 `iota` 位 0 | `StatusUnknown Status = iota` |
| Functional options | `With` 前缀 | `WithTimeout(d)` |
| Must 前缀 | panic 变体专用 | `MustParse()` |
| Import alias | 仅在冲突时使用 | `yaml "gopkg.in/yaml.v3"` |
| Getter | 不加 `Get` 前缀 | `Name()` 非 `GetName()` |

## 常见错误

| 错误写法 | 正确写法 | 说明 |
|----------|----------|------|
| `http_request_count` | `httpRequestCount` | Go 不用 snake_case |
| `http.HTTPClient` | `http.Client` | 与包名重复 |
| `GetName()` | `Name()` | Go 惯例省略 Get |
| `type UrlParser struct{}` | `type URLParser struct{}` | 缩写应全大写 |
| `ErrNotFound := "not found"` | `var ErrNotFound = errors.New("not found")` | 错误变量用 sentinel |
| `type NotFoundError struct{}` | `type NotFoundError struct{}` — 但字符串 `"Not Found"` | 错误字符串全小写 `"not found"` |
| `StatusNone Status = iota` | `StatusUnknown Status = iota` | 零值语义应为 Unknown |
| `pkg "my/pkg"` | 无 alias | 无冲突不加 alias |

## 深度参考

- [标识符命名详细规则](references/identifiers.md)：作用域命名、receiver 惯例、测试命名、缩写大小写规则、包名选择。
