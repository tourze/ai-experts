## 代码模式

### 1. 最小可用的 .golangci.yml

```yaml
run:
  timeout: 5m

linters:
  enable:
    - errcheck
    - govet
    - staticcheck
    - revive
    - gosec
    - gocritic
    - gofmt
    - gofumpt

linters-settings:
  errcheck:
    check-type-assertions: true
  gocritic:
    enabled-tags:
      - diagnostic
      - style
```

### 2. 精准抑制告警

```go
// 不推荐：没有 linter 名称和原因
//nolint

// 推荐：指定 linter 并说明原因
//nolint:errcheck // 明确忽略，Close 错误不影响主流程
_, _ = resp.Body.Read(nil)
```

### 3. CI 集成（GitHub Actions）

```yaml
- name: golangci-lint
  uses: golangci/golangci-lint-action@v6
  with:
    version: v1.64
```

### 4. 自动修复

```bash
# 修复支持自动修复的 linter 报告（gofmt、goimports 等）
golangci-lint run --fix
```
