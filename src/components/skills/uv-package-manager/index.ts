import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { pythonTestingPatternsSkill } from "../python-testing-patterns/index";
import { pythonTypeSafetySkill } from "../python-type-safety/index";

export const uvPackageManagerSkill = defineSkill({
  id: "uv-package-manager",
  fullName: "uv 包管理",
  description: "当用户要用 uv 初始化 Python 项目、管理依赖、虚拟环境、lockfile、workspace 或 CI 工作流时使用。",
  useCases: [
    "新建 Python 项目并统一依赖、解释器和虚拟环境管理方式。",
    "现有项目要从 `pip` / `requirements.txt` 迁移到 `pyproject.toml` + `uv.lock`。",
    "需要用 `uv run` 统一执行测试、类型检查和脚本。",
    "更完整的 workspace、Docker、CI 和 lockfile 工作流见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    "需要把测试工具链串起来时，联动 `python-testing-patterns`。",
    "需要把 mypy/pyright 等静态检查纳入开发流时，联动 `python-type-safety`。",
  ],
  constraints: [
    "单个项目只保留一个依赖真源：`pyproject.toml` + `uv.lock`。",
    "优先用 `uv run`，避免“激活了哪个 venv 我也说不清”的状态漂移。",
    "不要在同一仓库同时混用 `pip install`、Poetry 和 uv 修改依赖。",
    "锁文件进 CI 和发布流；需要可复现安装时使用 `uv sync --frozen`。",
    "文档只保留已验证的命令参数，避免写历史版本选项。",
  ],
  checklist: [
    "项目是否已经明确 Python 版本、依赖组和锁文件策略。",
    "开发、测试、CI 是否都通过 `uv run` / `uv sync` 执行。",
    "文档、脚本和仓库实际命令是否一致。",
    "是否避免了多个包管理器同时写同一份依赖。",
    "团队成员首次拉仓后能否按文档一步跑通。",
  ],
  relatedSkills: [
    {
      get id() {
        return pythonTypeSafetySkill.id;
      },
      reason: "需要把 mypy/pyright 等静态检查纳入开发流时，联动 `python-type-safety`。",
    },
    {
      get id() {
        return pythonTestingPatternsSkill.id;
      },
      reason: "需要把测试工具链串起来时，联动 `python-testing-patterns`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "多个真源并存",
      pass: "单一真源",
    }),
    defineAntiPattern({
      fail: "本地 vs CI 不一致",
      pass: "都走 uv run",
    }),
    defineAntiPattern({
      fail: "锁文件不提交",
      pass: "锁文件入仓 + frozen",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认项目边界、目标 Python 版本和是否已有 `pyproject.toml` / `uv.lock`；新项目可用 `uv init .` 起步。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "用 `uv python install <version>` 和 `uv venv --python <version>` 固定解释器与虚拟环境，避免依赖本机隐式状态。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "运行时依赖用 `uv add`，开发依赖用 `uv add --dev`；测试、类型检查和脚本统一通过 `uv run` 执行。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "提交 `uv.lock`；CI 或可复现安装使用 `uv sync --frozen`，workspace、Docker 和缓存策略读取 advanced reference。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "`pyproject.toml`、`uv.lock`、Python 版本和依赖组的单一真源说明。",
      "本地开发、测试、类型检查、lock、sync 和 CI 的 uv 命令清单。",
      "迁移项目中的旧包管理器残留、requirements 兼容处理和后续清理项。",
    ],
  }),
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "uv 包管理器的高级模式，包括 workspace 配置、Docker 集成、CI 工作流和锁文件策略。",
      loadWhen: "需要搭建 monorepo workspace、配置 CI 缓存或设计 lockfile 管理策略时读取。",
    }),
  ],
});
