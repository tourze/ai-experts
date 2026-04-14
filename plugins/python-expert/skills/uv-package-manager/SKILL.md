---
name: uv-package-manager
description: 当用户要用 uv 初始化 Python 项目、管理依赖、虚拟环境、lockfile、workspace 或 CI 工作流时使用。
---

# uv 包管理

## 适用场景

- 新建 Python 项目并统一依赖、解释器和虚拟环境管理方式。
- 现有项目要从 `pip` / `requirements.txt` 迁移到 `pyproject.toml` + `uv.lock`。
- 需要用 `uv run` 统一执行测试、类型检查和脚本。
- 更完整的 workspace、Docker、CI 和 lockfile 工作流见 [references/advanced-patterns.md](references/advanced-patterns.md)。
- 需要把测试工具链串起来时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。
- 需要把 mypy/pyright 等静态检查纳入开发流时，联动 [python-type-safety](../python-type-safety/SKILL.md)。

## 核心约束

- 单个项目只保留一个依赖真源：`pyproject.toml` + `uv.lock`。
- 优先用 `uv run`，避免“激活了哪个 venv 我也说不清”的状态漂移。
- 不要在同一仓库同时混用 `pip install`、Poetry 和 uv 修改依赖。
- 锁文件进 CI 和发布流；需要可复现安装时使用 `uv sync --frozen`。
- 文档只保留已验证的命令参数，避免写历史版本选项。

## 代码模式

```bash
uv init .
uv python install 3.12
uv venv --python 3.12
uv add ruff pytest
uv add --dev mypy
uv run pytest
uv lock
uv sync --frozen
```

## 检查清单

- 项目是否已经明确 Python 版本、依赖组和锁文件策略。
- 开发、测试、CI 是否都通过 `uv run` / `uv sync` 执行。
- 文档、脚本和仓库实际命令是否一致。
- 是否避免了多个包管理器同时写同一份依赖。
- 团队成员首次拉仓后能否按文档一步跑通。

## 反模式

- `uv add` 之后又手工改 `requirements.txt`，来源开始分叉。
- 本地用一个 venv，CI 用另一个命令链，最后环境不一致。
- 锁文件长期不提交，导致“我这能跑，你那不行”。
- 把 `uv` 只当更快的 `pip`，却不治理项目依赖入口。
- 文档继续保留未经验证的旧参数和旧工作流。
