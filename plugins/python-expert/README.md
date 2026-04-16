# python-expert

Python 开发专家插件，覆盖异步编程、后台任务、架构设计、异常治理、可观测性、性能优化、测试、类型安全与 `uv` 工作流。当前版本已补齐插件清单、hook 分发容错、文档结构统一和插件级回归测试。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 2 个本地 `PostToolUse Edit|Write` 守卫。
- `skills/`：9 个 Python 主题技能，统一采用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」结构。
- `tests/`：覆盖 manifest、dispatch、脚本文法、`SKILL.md` 结构、链接和代码示例语法。

## Skills

| Skill | 用途 |
|-------|------|
| `python-design-patterns` | KISS、SoC、SRP、组合优于继承 |
| `python-error-handling` | 输入验证、异常层级、部分失败处理 |
| `python-testing-patterns` | pytest fixtures、mocking、TDD |
| `python-type-safety` | 类型提示、泛型、Protocol、mypy/pyright |
| `python-performance-optimization` | cProfile、内存分析、瓶颈定位 |
| `python-observability` | 结构化日志、指标、分布式追踪 |
| `python-background-jobs` | 任务队列、Worker、事件驱动架构 |
| `async-python-patterns` | asyncio、并发编程、async/await 模式 |
| `uv-package-manager` | uv 快速依赖管理与虚拟环境 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| `PostToolUse Edit\|Write` | `syntax-python` | 对 `.py` / `.pyi` 执行 `py_compile` 语法检查 |
| `PostToolUse Edit\|Write` | `lint-ruff` | Ruff 存在时执行静态检查并阻断 error 级问题 |
| `PostToolUse Edit\|Write` | `debug-statement-guard`（由 `coding-expert` 提供） | 检测 `breakpoint()` / `pdb` / `print()` 等调试残留 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 安装

```bash
claude --plugin-dir /path/to/plugins/python-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install python-expert@ai-experts
claude plugin install python-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall python-expert
claude plugin uninstall python-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证命令

```bash
jq empty plugins/python-expert/.claude-plugin/plugin.json
jq empty plugins/python-expert/hooks/hooks.json
find plugins/python-expert/hooks plugins/python-expert/tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node plugins/python-expert/hooks/dispatch.mjs post-tool-use/edit-write </dev/null
node --test plugins/python-expert/tests/*.test.mjs
rg -n "TODO|FIXME|TBD|HACK|XXX|python-project-setup" plugins/python-expert
```
