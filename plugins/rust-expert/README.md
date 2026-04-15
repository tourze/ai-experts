# rust-expert

Rust 开发专家插件，提供惯用 Rust 编码规范、Tokio 异步编程指导，以及 Edit|Write 后的调试语句、编码与文件预算守卫。

## 目录

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 和 3 个 PostToolUse 守卫
- `skills/`：`rust-best-practices` 与 `rust-async-patterns`
- `tests/`：manifest、dispatch、编码守卫回归测试

## Skills

| Skill | 用途 |
|-------|------|
| `rust-best-practices` | 惯用 Rust 编码、借用与所有权、错误边界、Clippy、测试与文档 |
| `rust-async-patterns` | Tokio 异步运行时、取消/超时、JoinSet、channel、并发上限与常见死锁场景 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `debug-statement-guard` | 检测新增调试断点/调试输出；Rust 侧重点是 `dbg!()` |
| PostToolUse Edit\|Write | `encoding-guard` | 检查 BOM、非法 UTF-8 字节，以及 `.env.local` 这类多后缀文本文件 |
| PostToolUse Edit\|Write | `file-budget-guard` | 按扩展名执行文件预算与棘轮治理；`.rs` 默认预算 800 行 |

## 安装

```bash
claude --plugin-dir /path/to/plugins/rust-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install rust-expert@ai-experts
claude plugin install rust-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall rust-expert
claude plugin uninstall rust-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
python3 -m json.tool plugins/rust-expert/.claude-plugin/plugin.json >/dev/null
python3 -m json.tool plugins/rust-expert/hooks/hooks.json >/dev/null
find plugins/rust-expert -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/rust-expert/tests/*.test.mjs
```
