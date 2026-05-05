import {
  AgentSandbox,
  defineAgent,
  defineAgentWorkflow,
  defineAgentWorkflowGate,
  defineAgentWorkflowRoute,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { phpXFeaturesSkill } from "../../skills/php-8x-features/index";
import { phpTypeSafetySkill } from "../../skills/php-type-safety/index";
import { phpErrorHandlingSkill } from "../../skills/php-error-handling/index";
import { phpGeneratorsMemorySkill } from "../../skills/php-generators-memory/index";
import { phpDesignPatternsSkill } from "../../skills/php-design-patterns/index";
import { phpAsyncPatternsSkill } from "../../skills/php-async-patterns/index";
import { phpTestingSkill } from "../../skills/php-testing/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const phpReviewerAgent = defineAgent({
  id: "php-reviewer",
  description: "当需要执行 PHP 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 PHP 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineAgentWorkflow({
    direction: "TD",
    gates: [
      defineAgentWorkflowGate({
        id: "gate-1",
        skill: phpXFeaturesSkill.id,
        label: "门禁 1",
        checks: "语言特性使用：readonly class、enum、match、命名参数、Fibers 使用恰当性",
      }),
      defineAgentWorkflowGate({
        id: "gate-2",
        skill: phpTypeSafetySkill.id,
        label: "门禁 2",
        checks: "类型声明覆盖率：strict_types、返回类型、nullable、mixed 使用",
      }),
      defineAgentWorkflowGate({
        id: "gate-3",
        skill: evidenceQualityFrameworkSkill.id,
        label: "门禁 3",
        checks: "每条结论标注事实/推断/假设",
      }),
    ],
    routes: [
      defineAgentWorkflowRoute({
        id: "route-php-error-handling",
        triggers: ["throw", "catch", "try", "Exception"],
        skill: phpErrorHandlingSkill.id,
        checks: "异常层级设计、吞异常、getMessage 直接暴露、部分失败处理",
        output: "错误处理审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-php-generators-memory",
        triggers: ["yield", "Generator"],
        skill: phpGeneratorsMemorySkill.id,
        checks: "生成器使用、内存峰值、流式处理替代一次性加载",
        output: "内存优化建议",
      }),
      defineAgentWorkflowRoute({
        id: "route-php-design-patterns",
        triggers: ["class.*Service", "class.*Repository", "new"],
        skill: phpDesignPatternsSkill.id,
        checks: "DI 方式、构造注入 vs Facade、薄控制器、DTO 使用",
        output: "分层审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-php-async-patterns",
        triggers: ["Swoole", "ReactPHP", "Amphp", "Fiber"],
        skill: phpAsyncPatternsSkill.id,
        checks: "协程内阻塞 I/O、Channel 通信、内存泄漏、长驻进程",
        output: "异步安全结论",
      }),
      defineAgentWorkflowRoute({
        id: "route-php-testing",
        triggers: ["PHPUnit", "Pest", "mock", "RefreshDatabase"],
        skill: phpTestingSkill.id,
        checks: "测试隔离、mock 策略、数据库 trait、覆盖率",
        output: "测试质量审计",
      }),
    ],
    finalSteps: [
      defineAgentWorkflowStep({
        id: "final-1",
        label: "门禁：php-8x-features → php-type-safety → 确认基线",
      }),
      defineAgentWorkflowStep({
        id: "final-2",
        label: "路由：按 diff 内容匹配场景路由表，逐项深入",
      }),
      defineAgentWorkflowStep({
        id: "final-3",
        label: "证据：每条发现绑定 文件:行 + 代码片段",
      }),
      defineAgentWorkflowStep({
        id: "final-4",
        label: "标注：事实/推断/假设",
      }),
      defineAgentWorkflowStep({
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
      id: phpXFeaturesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 PHP 8.x 新特性（readonly、enum、match 等）的使用恰当性。",
    },
    {
      id: phpTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查 strict_types、返回类型和 nullable 声明覆盖率。",
    },
    {
      id: phpErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查异常层级设计和部分失败处理。",
    },
    {
      id: phpGeneratorsMemorySkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查生成器使用和大数组内存峰值风险。",
    },
    {
      id: phpDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 DI 方式、分层架构和 DTO 使用规范。",
    },
    {
      id: phpAsyncPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Swoole/Fiber 异步场景中的阻塞和泄漏风险。",
    },
    {
      id: phpTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 PHPUnit/Pest 测试隔离、mock 和覆盖率。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供通用测试方法论，补齐 PHP 测试审查盲区。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
