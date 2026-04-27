---
name: go-performance-benchmarking
description: 当 Go 代码需要 benchmark、pprof、benchstat、性能回归或优化验证时使用。
---

# go-performance-benchmarking

## 适用场景

- 需要写 Go benchmark、比较两个实现、解释 `benchstat`、定位 CPU/内存瓶颈。
- 需要优化热路径、减少分配、调整缓存、连接池、buffer、`sync.Pool` 或 GC 参数。
- 需要审查“性能优化”是否有基线、统计显著性和回归测试。
- 并发瓶颈配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；资源安全配合 [go-safety](../go-safety/SKILL.md)。

## 核心约束

- 没有基线不优化；先定义目标指标，再写 benchmark 或采集 profile。
- 一次只改一个变量，改前改后用同一命令多次采样，再用 `benchstat` 比较。
- 优先优化已证实的瓶颈：CPU profile、heap profile、trace、mutex/block profile 或生产指标。
- 先排除外部瓶颈：数据库、网络、锁等待、上游 API 慢时，减少本地分配通常无效。
- 优化代码必须保留可读性解释和 benchmark 证据，避免后续被误删。
- `sync.Pool`、`unsafe`、手写缓存只在 profile 证明收益并有测试保护时使用。

## 代码模式

### 1. 写可比较的 benchmark

```go
func BenchmarkEncode(b *testing.B) {
	payload := Payload{ID: "u1", Name: "Ada"}
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		if _, err := Encode(payload); err != nil {
			b.Fatal(err)
		}
	}
}
```

采样和比较：

```bash
go test -bench=BenchmarkEncode -benchmem -count=8 ./pkg/codec | tee /tmp/bench-old.txt
go test -bench=BenchmarkEncode -benchmem -count=8 ./pkg/codec | tee /tmp/bench-new.txt
benchstat /tmp/bench-old.txt /tmp/bench-new.txt
```

### 2. 从 profile 开始定位

```bash
go test -run='^$' -bench=BenchmarkEncode -cpuprofile=/tmp/cpu.out ./pkg/codec
go tool pprof /tmp/cpu.out
```

### 3. 常见低风险优化

```go
func Join(items []string) string {
	var b strings.Builder
	for _, item := range items {
		b.WriteString(item)
	}
	return b.String()
}
```

## 检查清单

- 是否有明确性能指标：延迟、吞吐、分配、CPU、内存或尾延迟？
- 是否保存了改前/改后的 benchmark 输出？
- benchmark 是否隔离单个函数或路径，避免把 setup 成本混进循环？
- profile 是否证明瓶颈在 Go 进程内，而不是外部 I/O？
- 优化是否配套正确性测试，防止快但错？
- 是否用 `benchstat` 判断统计显著性，而不是看单次结果？

## 反模式

### FAIL: 没有证据先改

```go
// 觉得 map 慢，直接换成全局缓存。
```

### PASS: 先测量再改

```bash
go test -bench=. -benchmem -count=8 ./...
```

### FAIL: benchmark 混入 setup 成本

```go
for i := 0; i < b.N; i++ {
	payload := loadFixtureFromDisk()
	Encode(payload)
}
```

### PASS: setup 放循环外

```go
payload := loadFixtureFromDisk()
b.ResetTimer()
for i := 0; i < b.N; i++ {
	Encode(payload)
}
```
