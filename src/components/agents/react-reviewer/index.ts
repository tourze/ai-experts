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
import { reactHooksSkill } from "../../skills/react-hooks/index";
import { reactPerformanceSkill } from "../../skills/react-performance/index";
import { reactServerComponentsSkill } from "../../skills/react-server-components/index";
import { reactComposableComponentsSkill } from "../../skills/react-composable-components/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const reactReviewerAgent = defineAgent({
  id: "react-reviewer",
  description: "当需要只读审查 React 组件架构、Hooks、性能、状态管理和最佳实践时使用。",
  role: `你是资深 React 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: reactHooksSkill.id,
        label: "门禁 1",
        checks: "Hooks 规则基线：依赖数组完整性、条件调用、cleanup 注册",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: reactPerformanceSkill.id,
        label: "门禁 2",
        checks: "重渲染基线：memo/useMemo/useCallback 滥用 vs 缺失",
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
        id: "route-react-hooks",
        triggers: ["useState", "useReducer", "useContext"],
        skill: reactHooksSkill.id,
        checks: "state colocation、Context 拆分、派生状态、useRef 误用",
        output: "状态管理审计",
      }),
      defineWorkflowRoute({
        id: "route-react-hooks-2",
        triggers: ["useEffect", "useLayoutEffect", "useCallback"],
        skill: reactHooksSkill.id,
        checks: "effect 依赖完整性、cleanup、stale closure、条件 effect",
        output: "Hooks 审计",
      }),
      defineWorkflowRoute({
        id: "route-react-performance",
        triggers: ["memo"],
        skill: reactPerformanceSkill.id,
        checks: "重渲染触发链、memoization 位置、外部 store 订阅粒度",
        output: "性能审计",
      }),
      defineWorkflowRoute({
        id: "route-react-composable-components",
        triggers: ["大组件", "多 props", "职责混合"],
        skill: reactComposableComponentsSkill.id,
        checks: "组件拆分、compound components、props 透传规范",
        output: "组件架构建议",
      }),
      defineWorkflowRoute({
        id: "route-react-server-components",
        triggers: ["\"use client\"", "\"use server\""],
        skill: reactServerComponentsSkill.id,
        checks: "Server/Client Component 边界、Server Actions、streaming",
        output: "RSC 架构审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：react-hooks → react-performance → 确认基线",
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
      id: reactHooksSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Hooks 依赖完整性、cleanup 和 stale closure。",
    },
    {
      id: reactPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查重渲染触发链和 memoization 位置。",
    },
    {
      id: reactServerComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Server/Client Component 边界和 streaming 策略。",
    },
    {
      id: reactComposableComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查组件拆分粒度和 props 透传规范。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
