import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowGate,
  defineWorkflowRoute,
  defineWorkflowStep,
} from "../../sdk";
import { codeReviewSkill } from "../code-review/index";
import { complexityReducerSkill } from "../complexity-reducer/index";
import { testQualityReviewSkill } from "../test-quality-review/index";

export const codeReviewAgentFrameworkSkill = defineSkill({
  id: "code-review-agent-framework",
  fullName: "Code Review Agent 框架",
  description: "当编写或维护只读 reviewer agent 时使用，提供跨语言代码审查的共享触发门禁、只读边界和证据绑定规则。",
  useCases: [
    "当编写或维护只读 reviewer agent 时使用，提供跨语言代码审查的共享触发门禁、只读边界和证据绑定规则。",
  ],
  constraints: [
    "Reviewer agent 默认只读，不修改文件、不安装依赖、不删除/移动文件、不改配置。",
    "每条发现必须绑定文件:行、关键代码片段、严重级别和证据强度。",
    "输出按安全性、正确性、影响面、执行成本排序，不把风格偏好写成阻断问题。",
    "命令、测试结果、退出码必须真实执行过才能报告；无证据不得声称通过。",
    "各专项 reviewer 只按 diff 触发相关场景，不全量加载所有 skill。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、输入范围、约束和验收标准。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取相关文件、配置、调用点、测试和同层模式，建立证据链。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每条发现标注事实、推断或假设；推断必须说明还需确认什么。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "只读 Bash 可用于版本查询、git 历史、文件统计、lint/typecheck 和测试执行。",
      }),
    ],
    gates: [
      defineWorkflowGate({
        id: "evidence-gate",
        skill: codeReviewSkill.id,
        label: "审查证据门禁",
        checks: "每条发现必须绑定文件:行、关键代码片段、严重级别和证据强度；命令和测试结果必须真实执行过。",
      }),
    ],
    routes: [
      defineWorkflowRoute({
        id: "core-review",
        triggers: ["业务逻辑、错误处理、边界条件、抽象质量"],
        skill: codeReviewSkill.id,
        checks: "用 Symptom / Source / Consequence / Remedy 四要素验证每条发现。",
        output: "按严重度排序的代码审查发现。",
      }),
      defineWorkflowRoute({
        id: "complexity-review",
        triggers: ["长函数、嵌套过深、条件组合复杂、职责边界混乱"],
        skill: complexityReducerSkill.id,
        checks: "先定位主要复杂度来源，再判断是重构建议还是阻断风险。",
        output: "复杂度来源、风险和最小化简方向。",
      }),
      defineWorkflowRoute({
        id: "test-review",
        triggers: ["测试、mock、fixture、覆盖率断言或 flaky 风险"],
        skill: testQualityReviewSkill.id,
        checks: "按测试质量风险维度扫描，不把风格偏好当成缺陷。",
        output: "测试质量风险、证据和修复方向。",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-report",
        label: "最终按阻断、高风险、建议、信息排序，并明确范围限制和未覆盖路径。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "代码审查报告：摘要、环境、发现、专项审计、正向观察、优先行动、范围限制。",
      "发现格式：文件:行、代码片段、严重级别、证据强度、影响范围和验证方式。",
      "Reviewer agent 扩展：在统一 workflow 中声明 evidence gate、专项 route 和收尾报告要求。",
    ],
  }),
});
