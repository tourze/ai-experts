---
name: go-safety
description: 当 Go 代码可能出现 nil、panic、资源泄漏、数据竞争或运行时安全问题时使用。
---

# go-safety

## 适用场景

- 编写或审查容易 panic 的 Go 代码：nil pointer、nil map 写入、slice 越界、类型断言、关闭 channel。
- 需要处理资源关闭、defer 放置、循环里的 `defer`、HTTP body、文件句柄、锁释放。
- 需要判断 slice/map 复制语义、共享 backing array、并发读写 map 或数据竞争。
- 涉及 goroutine 生命周期时配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；涉及错误传播时配合 [go-error-handling](../go-error-handling/SKILL.md)。

## 核心约束

- 不把 nil 当作默认成功值；成功路径的 slice/map 应表达为空集合或已初始化容器。
- map 写入前必须初始化；并发访问共享 map 必须有锁、channel 所有权或其他同步边界。
- `defer` 放在资源获得成功之后；循环中打开资源时不要把 `defer` 延迟到整个函数结束。
- 类型断言使用 `value, ok := x.(T)`，除非上游类型合同已被验证。
- 对外返回内部 slice/map 前要考虑 defensive copy，避免调用方修改内部状态。
- `panic` / `recover` 不是错误处理捷径；恢复只放在 goroutine 或进程边界，恢复后要记录并返回错误。

## 代码模式

### 1. 初始化 map 再写入

```go
func CountByStatus(items []Item) map[Status]int {
	counts := make(map[Status]int, len(items))
	for _, item := range items {
		counts[item.Status]++
	}
	return counts
}
```

### 2. 循环资源用 helper 收束 defer

```go
func readAll(paths []string) error {
	for _, path := range paths {
		if err := readOne(path); err != nil {
			return err
		}
	}
	return nil
}

func readOne(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open %q: %w", path, err)
	}
	defer file.Close()
	return consume(file)
}
```

### 3. 返回内部集合时复制

```go
func (c *Cache) Keys() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	keys := make([]string, 0, len(c.items))
	for key := range c.items {
		keys = append(keys, key)
	}
	return keys
}
```

## 检查清单

- 是否存在 nil map 写入、nil pointer 解引用、未检查的类型断言？
- 是否有成功路径返回 `nil` slice/map，影响 JSON 或调用方判断？
- `resp.Body.Close()`、`file.Close()`、`rows.Close()` 是否在成功获取资源后执行？
- 循环中是否积累了 `defer`，导致文件句柄或连接迟迟不释放？
- 共享 map/slice 是否有明确并发所有权和同步方式？
- 是否需要 `go test -race ./...` 或针对 panic 的回归测试？

## 反模式

### FAIL: nil map 写入

```go
var counts map[string]int
counts["ok"]++
```

### PASS: 显式初始化

```go
counts := make(map[string]int)
counts["ok"]++
```

### FAIL: 循环里积累 defer

```go
for _, path := range paths {
	file, _ := os.Open(path)
	defer file.Close()
	process(file)
}
```

### PASS: 每次迭代独立释放

```go
for _, path := range paths {
	if err := readOne(path); err != nil {
		return err
	}
}
```
