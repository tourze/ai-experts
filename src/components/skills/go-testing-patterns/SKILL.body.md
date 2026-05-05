## 代码模式

### 1. table-driven tests

```go
func TestSlugify(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		in   string
		want string
	}{
		{name: "spaces become hyphens", in: "hello world", want: "hello-world"},
		{name: "empty input", in: "", want: ""},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := Slugify(tt.in); got != tt.want {
				t.Fatalf("Slugify(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}
```

### 2. 集成测试使用 build tag

```go
//go:build integration

package userrepo_test

func TestRepositoryIntegration(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/test")
}
```

运行：

```bash
go test -tags=integration ./...
```

### 3. mock consumer-side interface

```go
type emailSender interface {
	Send(ctx context.Context, to string, body string) error
}

type Service struct {
	sender emailSender
}
```

## 常见错误

| 错误 | 修复 |
|------|------|
| 测内部字段/方法 | 测公共 API 的可观察行为 |
| `time.Sleep` 等异步完成 | 用 channel/WaitGroup 同步 |
| 测试间有执行顺序依赖 | 每个测试独立可运行 |
| 忘记 `t.Parallel()` | 独立纯函数测试应并行 |
| 集成测试混入单元测试 | `//go:build integration` 隔离 |
| 并发测试不跑 `-race` | `go test -race ./...` |

## 深度参考

- [testify.md](references/testify.md) — assert/require/mock/suite API
- [http-testing.md](references/http-testing.md) — httptest 模式
- [mocking.md](references/mocking.md) — mock 模式和可注入时钟
