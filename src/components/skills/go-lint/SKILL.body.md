## 适用场景

- 在 Go 项目中引入或调整 `golangci-lint` 配置（`.golangci.yml`）。
- 排查 lint 报错、选择启用/禁用哪些 linter、理解某条规则的意义。
- 需要用 `//nolint` 抑制告警，或评估是否应该全局禁用某个 linter。
- 在 CI/CD 流水线中集成 `golangci-lint` 作为 PR 门禁。
- 代码审查中讨论 lint 相关的代码质量问题。

## 核心约束

- **golangci-lint 是唯一推荐的 meta-linter**：不要单独安装 `gometalinter` 或手动逐个运行 linter。
- **不要因为一处违规模而全局禁用 linter**：用行级 `//nolint` 精准抑制，并附带 linter 名称和原因。
- **lint 必须在 CI 中运行**：PR 检查至少包含 `golangci-lint run`，阻止新问题合入。
- **先修复，后抑制**：看到告警优先修复代码，`//nolint` 是最后手段。
- **配置文件纳入版本控制**：`.golangci.yml` 放在仓库根目录，团队共享同一份配置。

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

## 常见错误

| 错误 | 修复 |
|------|------|
| 全局禁用 linter 只因一个文件违规 | 用行级 `//nolint:<linter> // <原因>` 精准抑制 |
| `//nolint` 不带 linter 名称 | 必须指定：`//nolint:gosec`，避免掩盖其他问题 |
| CI 中不设 timeout 导致卡死 | `run.timeout: 5m` 或命令行 `--timeout=5m` |
| 同时启用 gofmt 和 gofumpt | 只保留 gofumpt，它是 gofmt 的超集 |
| 修改配置后不验证 | 运行 `golangci-lint config verify` 检查配置合法性 |
| 在 generated 文件上跑 lint | 用 `exclude-generated` 或 `skip-dirs` 排除 |

## 深度参考

- [linter-reference.md](references/linter-reference.md) — linter 速查表、配置模板、nolint 模式、常见问题修复
