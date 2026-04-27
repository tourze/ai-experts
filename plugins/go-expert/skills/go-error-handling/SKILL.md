---
name: go-error-handling
description: 当 Go 代码需要设计、包装、比较、传播或审查 error 语义时使用。
---

# go-error-handling

## 适用场景

- 编写或审查返回 `error` 的 Go 函数、库 API、CLI 命令、HTTP handler 或后台任务。
- 需要决定 sentinel error、自定义错误类型、`errors.Is` / `errors.As`、`errors.Join` 或 panic 边界。
- 需要修复丢弃错误、覆盖根因、错误文本不稳定、调用方无法分类处理等问题。
- 涉及日志和可观测性时配合 `devops-expert` 的 observability skill；涉及安全错误暴露时配合 `security-expert`。

## 核心约束

- 不丢弃错误；如果确实无法处理，必须说明原因并让调用方看到失败。
- 跨函数边界保留根因：用 `fmt.Errorf("operation: %w", err)` 包装，不用 `%v` 吞掉错误链。
- 错误文本面向人，错误类型/变量面向程序；调用方需要分支时提供 sentinel error 或自定义类型。
- 不用 panic 表达普通业务失败；panic 只用于不可恢复的编程错误或初始化失败，并在进程边界恢复。
- 错误字符串小写、无句号，并带操作上下文；不要把动态上下文塞进 sentinel error。
- 对外 API 的错误语义是合同，修改前要反查调用点和测试。

## 代码模式

### 1. 保留错误链

```go
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config %q: %w", path, err)
	}

	cfg, err := parseConfig(data)
	if err != nil {
		return nil, fmt.Errorf("parse config %q: %w", path, err)
	}
	return cfg, nil
}
```

### 2. 需要程序分支时提供稳定错误

```go
var ErrNotFound = errors.New("user: not found")

func FindUser(id string) (*User, error) {
	user, ok := users[id]
	if !ok {
		return nil, ErrNotFound
	}
	return user, nil
}

if errors.Is(err, ErrNotFound) {
	return http.StatusNotFound
}
```

### 3. 需要携带字段时使用自定义错误类型

```go
type ValidationError struct {
	Field string
}

func (e ValidationError) Error() string {
	return "validation: invalid " + e.Field
}
```

## 检查清单

- 每个 `err` 是否被处理、返回、包装或明确忽略？
- 包装错误时是否使用 `%w`，调用方还能否 `errors.Is` / `errors.As`？
- 调用方是否依赖错误字符串做判断？如果是，应改成稳定错误合同。
- sentinel error 是否只表达稳定类别，而不是包含用户 ID、路径、状态等动态值？
- panic 是否只停留在进程边界、初始化或不可恢复路径？
- 测试是否覆盖错误分支和错误链判断？

## 反模式

### FAIL: 覆盖根因

```go
if err != nil {
	return errors.New("load failed")
}
```

### PASS: 保留上下文和根因

```go
if err != nil {
	return fmt.Errorf("load user profile: %w", err)
}
```

### FAIL: 用字符串分支

```go
if err.Error() == "not found" {
	return nil
}
```

### PASS: 用错误合同分支

```go
if errors.Is(err, ErrNotFound) {
	return nil
}
```
