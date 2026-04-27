# Benchmark 深度参考

## 写可比较的 benchmark

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

### Go 1.24+ b.Loop()

```go
func BenchmarkEncode(b *testing.B) {
    payload := Payload{ID: "u1", Name: "Ada"}
    b.ReportAllocs()

    for b.Loop() {
        Encode(payload)
    }
}
```

`b.Loop()` 自动处理 `b.N`，防止编译器过度优化循环体。

## benchstat 比较

```bash
# 改前
go test -bench=BenchmarkEncode -benchmem -count=8 ./pkg/codec | tee /tmp/bench-old.txt
# 改后
go test -bench=BenchmarkEncode -benchmem -count=8 ./pkg/codec | tee /tmp/bench-new.txt
# 比较
benchstat /tmp/bench-old.txt /tmp/bench-new.txt
```

结果解读：
- `geomean` 行是整体几何平均
- `±%` 列是置信区间；小于 5% 通常不显著
- `delta` 列为负表示改善

## 统计显著性

- 至少 8 次采样（`-count=8`）
- 对比时关注 `benchstat` 输出的 `p-value`
- 单次结果不可信：机器负载、GC 时间、CPU 频率都会波动

## CI 回归检测

```yaml
# GitHub Actions 示例
- name: Benchmark
  run: |
    go test -bench=. -benchmem -count=8 ./... | tee /tmp/bench-new.txt
    benchstat /tmp/bench-baseline.txt /tmp/bench-new.txt
```

将基准结果存入仓库（`/tmp/bench-baseline.txt`），CI 中对比新结果。回归超过阈值则失败。

## 常见 benchmark 错误

### setup 混入循环

```go
// 错误
for i := 0; i < b.N; i++ {
    payload := loadFixtureFromDisk() // setup 在循环内
    Encode(payload)
}

// 正确
payload := loadFixtureFromDisk()
b.ResetTimer()
for i := 0; i < b.N; i++ {
    Encode(payload)
}
```

### 忽略 b.StopTimer / b.StartTimer

当 setup 必须在循环内但不想计入时间：

```go
for i := 0; i < b.N; i++ {
    b.StopTimer()
    payload := generatePayload()
    b.StartTimer()
    Encode(payload)
}
```

### 多输入规模

```go
func BenchmarkFibonacci(b *testing.B) {
    sizes := []int{10, 20, 30}
    for _, size := range sizes {
        b.Run(fmt.Sprintf("n=%d", size), func(b *testing.B) {
            b.ReportAllocs()
            for i := 0; i < b.N; i++ {
                Fibonacci(size)
            }
        })
    }
}
```

## 快速参考

```bash
go test -bench=. -benchmem ./...           # 所有 benchmark
go test -bench=BenchmarkEncode -count=8 .  # 8 次采样
go test -bench=. -cpuprofile=cpu.out ./... # benchmark + CPU profile
go test -bench=. -memprofile=mem.out ./... # benchmark + 内存 profile
benchstat old.txt new.txt                  # 比较两次结果
```
