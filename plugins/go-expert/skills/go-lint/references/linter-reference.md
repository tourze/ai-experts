# Linter 速查参考

## 核心 Linter 速查表

| Linter | 检测内容 | 推荐 |
|--------|---------|------|
| errcheck | 未检查的 error 返回值 | 必开 |
| govet | 编译器级别的可疑代码 | 必开（Go 内置） |
| staticcheck | 大量静态分析规则（SA*、ST*、S*） | 必开 |
| revive | golint 的替代品，可配置规则 | 推荐 |
| gosec | 安全漏洞（硬编码凭据、SQL 注入、弱随机等） | 推荐 |
| gocritic | 代码风格和诊断建议 | 推荐 |
| gofumpt | 比 gofmt 更严格的格式化 | 推荐（替代 gofmt） |
| goimports | import 排序和自动管理 | 推荐 |
| unused | 未使用的代码 | 必开（golangci-lint 默认启用） |
| gosimple | 可简化的代码（S1000 系列） | 必开（staticcheck 子集） |
| ineffassign | 无效赋值 | 推荐（golangci-lint 默认启用） |
| typecheck | 类型错误 | 必开（golangci-lint 默认启用） |

## 最小配置模板

```yaml
# .golangci.yml
run:
  timeout: 5m
  modules-download-mode: readonly

linters:
  disable-all: true
  enable:
    - errcheck
    - govet
    - staticcheck
    - revive
    - gosec
    - gocritic
    - gofumpt
    - goimports
    - unused
    - ineffassign

linters-settings:
  errcheck:
    check-type-assertions: true
    check-blank: true
  revive:
    rules:
      - name: unused-parameter
      - name: unreachable-code
      - name: context-as-argument
  gocritic:
    enabled-tags:
      - diagnostic
      - style
      - performance

issues:
  exclude-generated: strict
  max-issues-per-linter: 50
  max-same-issues: 5

severity:
  default-severity: warning
```

## nolint 指令模式

### 行级抑制（推荐）

```go
//nolint:gosec // G101: 示例 URL 中的占位符密码，非真实凭据
const exampleDSN = "mysql://user:password@localhost/db"
```

### 多 linter 抑制

```go
//nolint:errcheck,gosec // Read 返回值仅用于触发连接，错误不影响逻辑
_, _ = conn.Read(buf)
```

### 禁止：裸 nolint / 无原因 / 全局禁用

裸 `//nolint` 会掩盖所有 linter 告警；`//nolint:gosec` 没有原因说明也禁止。
不要在 `.golangci.yml` 中全局禁用 linter 只为一处违规。

## 常见问题与修复

### errcheck: 未检查 error

```go
// BAD
data, _ := os.ReadFile(path)

// GOOD
data, err := os.ReadFile(path)
if err != nil {
    return fmt.Errorf("read %q: %w", path, err)
}
```

### gosec G601: 隐式内存别名

```go
// BAD
for _, item := range items {
    go func() { process(&item) }()  // 循环变量地址固定
}

// GOOD
for _, item := range items {
    item := item  // 显式绑定
    go func() { process(&item) }()
}
```

### staticcheck SA4006: 无效赋值

```go
// BAD
x = calculate()
x = recalculate()  // 上一行赋值未被使用

// GOOD — 如果确实需要忽略
_ = calculate()
x = recalculate()
```

### revive: context-as-argument — context 只做第一个参数

```go
// BAD: ctx 出现两次
func Process(ctx context.Context, data string, background context.Context)

// GOOD
func Process(ctx context.Context, data string)
```

## CI 集成要点

- **GitHub Actions**：使用 `golangci/golangci-lint-action`，缓存自动处理。
- **GitLab CI**：`golangci-lint run --out-format code-climate` 输出到 GitLab Code Quality。
- **超时设置**：始终设置 `run.timeout`（推荐 5m），避免大仓库卡死。
- **缓存**：golangci-lint 会自动缓存分析结果，CI 中缓存 `~/.cache/golangci-lint` 可加速。
- **版本固定**：CI 中固定 golangci-lint 版本，避免上游更新引入新告警导致流水线意外失败。
