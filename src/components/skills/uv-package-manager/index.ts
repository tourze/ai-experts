import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const uvPackageManagerSkill = defineSkill({
  id: "uv-package-manager",
  fullName: "uv 包管理",
  description: "当用户要用 uv 初始化 Python 项目、管理依赖、虚拟环境、lockfile、workspace 或 CI 工作流时使用。",
  useCases: [
    "新建 Python 项目并统一依赖、解释器和虚拟环境管理方式。",
    "现有项目要从 `pip` / `requirements.txt` 迁移到 `pyproject.toml` + `uv.lock`。",
    "需要用 `uv run` 统一执行测试、类型检查和脚本。",
    "更完整的 workspace、Docker、CI 和 lockfile 工作流见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    "需要把测试工具链串起来时，联动 [python-testing-patterns](../python-testing-patterns/SKILL.md)。",
    "需要把 mypy/pyright 等静态检查纳入开发流时，联动 [python-type-safety](../python-type-safety/SKILL.md)。",
  ],
  constraints: [
    "单个项目只保留一个依赖真源：`pyproject.toml` + `uv.lock`。",
    "优先用 `uv run`，避免“激活了哪个 venv 我也说不清”的状态漂移。",
    "不要在同一仓库同时混用 `pip install`、Poetry 和 uv 修改依赖。",
    "锁文件进 CI 和发布流；需要可复现安装时使用 `uv sync --frozen`。",
    "文档只保留已验证的命令参数，避免写历史版本选项。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for uv-package-manager.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
