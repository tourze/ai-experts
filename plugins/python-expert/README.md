# python-expert

Python 开发专家能力，覆盖异步编程、后台任务、架构设计、异常治理、可观测性、性能优化、测试、类型安全与 `uv` 工作流。当前版本已补齐能力清单、hook 分发容错、文档结构统一和目录级回归测试。

## 目录结构

- `hooks/`：4 个本地 `PostToolUse Edit|Write` 守卫。
- `skills/`：9 个 Python 主题技能，统一采用「适用场景 → 核心约束 → 代码模式 → 检查清单 → 反模式」结构。
- `tests/`：覆盖工具语法、`SKILL.md` 结构、链接和代码示例语法。

## Skills

| Skill | 用途 |
|-------|------|
| `async-python-patterns` | asyncio、并发编程、async/await 模式 |
| `python-background-jobs` | 任务队列、Worker、事件驱动架构 |
| `python-design-patterns` | KISS、SoC、SRP、组合优于继承 |
| `python-error-handling` | 输入验证、异常层级、部分失败处理 |
| `python-observability` | 结构化日志、指标、分布式追踪 |
| `python-performance-optimization` | cProfile、内存分析、瓶颈定位 |
| `python-testing-patterns` | pytest fixtures、mocking、TDD |
| `python-type-safety` | 类型提示、泛型、Protocol、mypy/pyright |
| `uv-package-manager` | uv 快速依赖管理与虚拟环境 |

## Agents

| Agent | 用途 |
|-------|------|
| `python-engineer` | 当需要端到端设计或实现 Python 项目时使用——覆盖类型安全、错误处理、异步并发、性能优化、设计模式、后台任务、可观测性建设与测试策略。 |
| `python-reviewer` | Python 专项只读评审：类型安全、异步模式、Pythonic 惯用法与测试缺口 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| `PostToolUse Edit\|Write` | `syntax-python` | 对 `.py` / `.pyi` 执行 `py_compile` 语法检查 |
| `PostToolUse Edit\|Write` | `lint-ruff` | Ruff 存在时执行静态检查并阻断 error 级问题 |
| `PostToolUse Edit\|Write` | `debug-statement-guard`（由 `coding-expert` 提供） | 检测 `breakpoint()` / `pdb` / `print()` 等调试残留 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find plugins/python-expert/hooks plugins/python-expert/tests -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/python-expert/tests/*.test.mjs
rg -n "TODO|FIXME|TBD|HACK|XXX|python-project-setup" plugins/python-expert
```
