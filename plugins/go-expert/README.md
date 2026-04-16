# go-expert

Go 开发专家插件，覆盖 Go 并发模式、Edit|Write 后的语法与静态检查、调试语句检测，以及文件预算守卫。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 1 个本地 PostToolUse 守卫脚本。
- `skills/`：`go-concurrency-patterns` 并发模式技能。

## Skills

| Skill | 用途 |
|-------|------|
| `go-concurrency-patterns` | goroutine 生命周期、channel 关闭语义、errgroup/限流/优雅停机模式 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-go` | Go 语法检查；在存在 `go.mod` / `go.work` 时执行 `go vet` |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | fmt.Print\*() / spew.Dump() 检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 验证命令

在插件目录执行：

```bash
jq empty .claude-plugin/plugin.json
jq empty hooks/hooks.json
find hooks tests -type f \( -name '*.mjs' -o -name '*.js' \) -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
node hooks/dispatch.mjs post-tool-use/edit-write </dev/null
printf '{not-json' | node hooks/dispatch.mjs post-tool-use/edit-write
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/go-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install go-expert@ai-experts
claude plugin install go-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall go-expert
claude plugin uninstall go-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

运行时依赖：`node` 必需；`go` / `gofmt` 可选。缺少 Go 工具链时，`syntax-go` 会自动回退到本地括号/字符串/注释闭合检查，不会因为缺少 `go.mod` 而误阻塞。
