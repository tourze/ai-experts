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
import { modernJavascriptPatternsSkill } from "../../skills/modern-javascript-patterns/index";
import { javascriptTypescriptJestSkill } from "../../skills/javascript-typescript-jest/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const javascriptReviewerAgent = defineAgent({
  id: "javascript-reviewer",
  description: "当需要执行 JavaScript 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 JavaScript 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: modernJavascriptPatternsSkill.id,
        label: "门禁 1",
        checks: "ES6+ 惯用法：模块系统、箭头函数、解构、可选链、空值合并",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: javascriptTypescriptJestSkill.id,
        label: "门禁 2",
        checks: "测试基线：Jest/Vitest 覆盖、mock 策略、异步测试",
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
        id: "route-modern-javascript-patterns",
        triggers: ["async", "await", "Promise", ".then", "callback"],
        skill: modernJavascriptPatternsSkill.id,
        checks: "async/await vs Promise 混用、并发竞态、错误传播",
        output: "异步安全结论",
      }),
      defineWorkflowRoute({
        id: "route-modern-javascript-patterns-2",
        triggers: ["var", "function", "prototype"],
        skill: modernJavascriptPatternsSkill.id,
        checks: "ES6+ 迁移建议、class vs prototype、模块化",
        output: "现代化建议",
      }),
      defineWorkflowRoute({
        id: "route-modern-javascript-patterns-3",
        triggers: ["this."],
        skill: modernJavascriptPatternsSkill.id,
        checks: "this 绑定、闭包陷阱、意外全局、严格模式",
        output: "作用域审计",
      }),
      defineWorkflowRoute({
        id: "route-javascript-typescript-jest",
        triggers: ["jest", "vitest", "describe", "it", "mock"],
        skill: javascriptTypescriptJestSkill.id,
        checks: "测试隔离、mock 清理、异步测试 done/timer",
        output: "测试质量审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：modern-javascript-patterns → javascript-typescript-jest → 确认基线",
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
      reason: "提供统一审查流程和发现分级标准。",
    },
    {
      id: modernJavascriptPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 ES6+ 惯用法、异步模式和作用域陷阱。",
    },
    {
      id: javascriptTypescriptJestSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计 Jest/Vitest 测试隔离、mock 策略和异步测试。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "补充通用测试方法论，覆盖测试缺口。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
