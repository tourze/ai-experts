import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { pythonTypeSafetySkill } from "../../skills/python-type-safety/index";
import { pythonErrorHandlingSkill } from "../../skills/python-error-handling/index";
import { asyncPythonPatternsSkill } from "../../skills/async-python-patterns/index";
import { pythonPerformanceOptimizationSkill } from "../../skills/python-performance-optimization/index";
import { pythonDesignPatternsSkill } from "../../skills/python-design-patterns/index";
import { pythonObservabilitySkill } from "../../skills/python-observability/index";
import { pythonTestingPatternsSkill } from "../../skills/python-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { pythonBackgroundJobsSkill } from "../../skills/python-background-jobs/index";
import { uvPackageManagerSkill } from "../../skills/uv-package-manager/index";

export const pythonEngineerAgent = defineAgent({
  id: "python-engineer",
  description: "当需要端到端设计或实现 Python 项目时使用——覆盖类型安全、错误处理、异步并发、性能优化、设计模式、后台任务、可观测性建设与测试策略。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Python 工程师。你可以读取项目源码、pyproject.toml 与依赖，设计方案并在用户指定目录下编写或修改 Python 代码、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认范围：新项目搭建 / 服务实现 / 重构 / 性能优化 / 异步迁移 / 可观测性补齐；明确 Python 版本与关键依赖。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "现状评估：读取既有模块结构、类型注解、错误处理和测试覆盖，建立基线。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "设计优先：涉及异步边界、错误策略、后台任务的改动先出设计，再落代码。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "实现闭环：写代码 → 补类型 → 补测试 → mypy / pyright → pytest → 性能验证。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "交付：代码变更 + 测试 + 类型检查通过 + 设计决策说明。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Python 工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[模块结构 / 类型覆盖 / 错误策略 / 测试覆盖 / 性能基线]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[接口契约 / 异步边界 / 错误策略 / 数据流]",
      }),
      defineAgentOutputSection({
        title: "实现变更",
        body: "[文件 → 改动说明]",
      }),
      defineAgentOutputSection({
        title: "测试策略",
        body: "[层 / 测试点 / 工具]",
      }),
      defineAgentOutputSection({
        title: "验证结果",
        body: "[mypy / pytest / ruff / 性能对比 输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[未测试的路径 / 未类型化的模块]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于：`uv run pytest`、`mypy`、`pyright`、`ruff`、`python -m cProfile`、`uv sync`、git 操作。禁止：修改生产配置、连接生产数据库、`uv add` 以外的依赖变更不经确认。",
  ],
  qualityStandards: [
    "新代码默认带完整类型注解，`mypy --strict` 或等效 pyright 配置下零错误。",
    "异常不吞：捕获具体异常类型，要么处理、要么包装后 raise、要么显式记录。",
    "异步函数不混入阻塞调用；涉及 CPU 密集任务走 `run_in_executor` 或后台 worker。",
    "性能声明必须有 profiling 数据支撑，不允许凭感觉声称\"更快\"。",
    "每个模块至少有一个测试文件，关键路径有 happy/edge/error 三层覆盖。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: pythonTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonTypeSafetySkill.description,
    },
    {
      id: pythonErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonErrorHandlingSkill.description,
    },
    {
      id: asyncPythonPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: asyncPythonPatternsSkill.description,
    },
    {
      id: pythonPerformanceOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonPerformanceOptimizationSkill.description,
    },
    {
      id: pythonDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonDesignPatternsSkill.description,
    },
    {
      id: pythonObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonObservabilitySkill.description,
    },
    {
      id: pythonTestingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonTestingPatternsSkill.description,
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: testingPatternsSkill.description,
    },
    {
      id: pythonBackgroundJobsSkill.id,
      mode: SkillUseMode.Preload,
      reason: pythonBackgroundJobsSkill.description,
    },
    {
      id: uvPackageManagerSkill.id,
      mode: SkillUseMode.Preload,
      reason: uvPackageManagerSkill.description,
    }
  ],
});
