import {
  AgentSandbox,
  defineAgent,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { pythonTypeSafetySkill } from "../../skills/python-type-safety/index";
import { pythonErrorHandlingSkill } from "../../skills/python-error-handling/index";
import { asyncPythonPatternsSkill } from "../../skills/async-python-patterns/index";
import { pythonPerformanceOptimizationSkill } from "../../skills/python-performance-optimization/index";
import { pythonDesignPatternsSkill } from "../../skills/python-design-patterns/index";
import { pythonObservabilitySkill } from "../../skills/python-observability/index";
import { pythonTestingPatternsSkill } from "../../skills/python-testing-patterns/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { pythonBackgroundJobsSkill } from "../../skills/python-background-jobs/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const pythonReviewerAgent = defineAgent({
  id: "python-reviewer",
  description: "当需要执行 Python 专项代码审查时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 Python 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: pythonTypeSafetySkill.id,
        label: "门禁 1",
        checks: "类型标注完整性：mypy/pyright 配置、Any 使用、type ignore 注释",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: pythonErrorHandlingSkill.id,
        label: "门禁 2",
        checks: "异常边界：裸 except、吞异常、异常层级设计",
      }),
      defineWorkflowGate({
        id: "gate-3",
        skill: evidenceQualityFrameworkSkill.id,
        label: "门禁 3",
        checks: "每条结论标注事实/推断/假设",
      }),
    ],
    routes: [
      defineWorkflowRoute({
        id: "route-async-python-patterns",
        triggers: ["async def", "await", "asyncio", "TaskGroup"],
        skill: asyncPythonPatternsSkill.id,
        checks: "同步阻塞混入、无界 gather、CancellationError 吞掉、Task 泄漏",
        output: "异步安全结论",
      }),
      defineWorkflowRoute({
        id: "route-python-design-patterns",
        triggers: ["def __init__", "Protocol", "ABC"],
        skill: pythonDesignPatternsSkill.id,
        checks: "组合 vs 继承、构造注入、God object 拆分、依赖方向",
        output: "分层建议",
      }),
      defineWorkflowRoute({
        id: "route-python-performance-optimization",
        triggers: ["cProfile", "timeit"],
        skill: pythonPerformanceOptimizationSkill.id,
        checks: "profiling 证据链、内存分析、优化前后对比",
        output: "性能证据验证",
      }),
      defineWorkflowRoute({
        id: "route-python-observability",
        triggers: ["logging", "structlog", "opentelemetry"],
        skill: pythonObservabilitySkill.id,
        checks: "结构化日志、trace 传播、指标暴露、敏感数据脱敏",
        output: "可观测性审计",
      }),
      defineWorkflowRoute({
        id: "route-python-testing-patterns",
        triggers: ["pytest", "unittest", "mock", "fixture"],
        skill: pythonTestingPatternsSkill.id,
        checks: "测试隔离、fixture 作用域、mock 滥用、参数化覆盖",
        output: "测试质量审计",
      }),
      defineWorkflowRoute({
        id: "route-python-background-jobs",
        triggers: ["celery", "RQ", "arq", "task", "queue"],
        skill: pythonBackgroundJobsSkill.id,
        checks: "幂等性、重试边界、死信队列、任务超时",
        output: "后台任务审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：type-safety → error-handling → 确认基线",
      }),
      defineWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配本 workflow 的 route 节点，逐项深入",
      }),
      defineWorkflowStep({
        id: "final-3",
        label: "证据：每条发现绑定 文件:行 + 代码片段",
      }),
      defineWorkflowStep({
        id: "final-4",
        label: "标注：事实/推断/假设",
      }),
      defineWorkflowStep({
        id: "final-5",
        label: "排序：安全 > 正确性 > 影响面 > 执行成本",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供统一代码审查流程和发现分级框架。",
    },
    {
      id: pythonTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查类型标注完整性和 Any 滥用。",
    },
    {
      id: pythonErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查裸 except、吞异常和异常层级设计。",
    },
    {
      id: asyncPythonPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查异步代码中的阻塞混入和 Task 泄漏。",
    },
    {
      id: pythonPerformanceOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "验证性能优化是否有 profiling 证据支撑。",
    },
    {
      id: pythonDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查组合 vs 继承、God object 和依赖方向。",
    },
    {
      id: pythonObservabilitySkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查日志结构化、trace 传播和敏感数据脱敏。",
    },
    {
      id: pythonTestingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查测试隔离、fixture 作用域和 mock 滥用。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供通用测试方法论，补齐 Python 测试审查盲区。",
    },
    {
      id: pythonBackgroundJobsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查后台任务幂等性、重试边界和死信队列。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
