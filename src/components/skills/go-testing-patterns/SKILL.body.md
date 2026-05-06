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
