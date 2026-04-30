# go-expert

Go 开发专家能力，覆盖 Go 代码风格、错误处理、运行时安全、context 生命周期、并发模式、测试模式、性能验证，以及 Edit|Write 后的语法与静态检查。

## 目录结构

- `hooks/`：3 个本地 PostToolUse 守卫脚本。
- `skills/`：Go P0 专题技能，按风格、错误、安全、context、并发、测试、性能拆分。

## Skills

| Skill | 用途 |
|-------|------|
| `go-code-style` | Go 可读性、文件组织、函数签名、导出面和惯用写法 |
| `go-naming` | 命名约定：包名、构造器、接口、错误、布尔字段、常量、缩写、枚举零值 |
| `go-error-handling` | error 设计、包装、比较、传播、panic 边界 |
| `go-safety` | nil、panic、资源释放、slice/map 共享状态和数据竞争 |
| `go-security` | 安全审计：SQL/命令注入、加密、认证、密钥管理、输入验证、依赖漏洞 |
| `go-context-lifecycle` | context 传播、取消、timeout、deadline 和 request-scoped value |
| `go-concurrency-patterns` | goroutine 生命周期、channel 关闭语义、errgroup/限流/优雅停机模式 |
| `go-testing-patterns` | table-driven tests、mock、integration build tags、race、fuzz、flaky test |
| `go-performance` | benchmark、pprof、benchstat、性能回归和优化验证 |
| `go-data-structures` | slice/map 内部机制、泛型容器、container/*、copy 语义、选择指南 |
| `go-troubleshooting` | 调试决策树、pprof 工作流、dlv、GODEBUG、常见 bug 模式 |
| `go-structs-interfaces` | 接口设计、结构体组合、embedding、receiver 选择、零值可用、泛型 vs any |
| `go-design-patterns` | 架构模式、函数式选项、构造器、韧性模式、DI、graceful shutdown |
| `go-database` | SQL 查询、事务、连接池、NULLable 扫描、migration、repository 模式 |
| `go-observability` | 日志(slog)、指标(Prometheus)、链路追踪(OpenTelemetry)、告警、信号关联 |
| `go-project-layout` | 目录结构、模块命名、workspace、依赖管理 |
| `go-lint` | golangci-lint 配置、linter 规则、nolint 指令、CI 集成 |
| `go-cli` | CLI 应用：Cobra/Viper、信号处理、退出码、shell 补全 |
| `go-grpc` | gRPC/protobuf：服务定义、拦截器、流式 RPC、TLS、性能 |

## Agents

| Agent | 用途 |
|-------|------|
| `go-reviewer` | 执行 Go 专项代码审查 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-go` | Go 语法检查；在存在 `go.mod` / `go.work` 时执行 `go vet` |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | fmt.Print\*() / spew.Dump() 检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 协作关系

- `go-concurrency-patterns` 只处理并发结构和 goroutine 生命周期；context 传播细节交给 `go-context-lifecycle`。
- `go-testing-patterns` 负责 Go 测试设计；性能 benchmark 与 pprof 交给 `go-performance`。
- `go-safety` 负责运行时安全和资源释放；安全漏洞防御交给 `go-security`。
- `go-performance` 负责优化方法论；排查"为什么不对"交给 `go-troubleshooting`。
- `go-data-structures` 负责数据结构选择和内部机制；别名/nil 陷阱交给 `go-safety`。
- `go-naming` 负责标识符命名；代码风格和格式交给 `go-code-style`。
- 通用代码审查、调试方法和交付验证继续复用 [coding-expert](../coding-expert/README.md) 与 [testing-expert](../testing-expert/README.md)。

## 验证命令

在当前目录执行：

```bash
find hooks tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

