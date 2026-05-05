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
import { nextjsDeveloperSkill } from "../../skills/nextjs-developer/index";
import { reactServerComponentsSkill } from "../../skills/react-server-components/index";
import { reactHooksSkill } from "../../skills/react-hooks/index";
import { reactPerformanceSkill } from "../../skills/react-performance/index";
import { reactComposableComponentsSkill } from "../../skills/react-composable-components/index";
import { typescriptTypeSafetySkill } from "../../skills/typescript-type-safety/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const nextjsReviewerAgent = defineAgent({
  id: "nextjs-reviewer",
  description: "当需要只读审查 Next.js App Router、Server Components、缓存、路由和部署风险 时使用。",
  role: `你是资深 Next.js 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineAgentWorkflow({
    direction: "TD",
    gates: [
      defineAgentWorkflowGate({
        id: "gate-1",
        skill: nextjsDeveloperSkill.id,
        label: "门禁 1",
        checks: "路由结构基线：App Router 布局树、loading/error 边界、middleware 配置",
      }),
      defineAgentWorkflowGate({
        id: "gate-2",
        skill: reactServerComponentsSkill.id,
        label: "门禁 2",
        checks: "RSC 边界基线：Server/Client Component 划分、Server Actions 安全",
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
        id: "route-nextjs-developer",
        triggers: ["layout.tsx", "page.tsx", "route.ts", "middleware.ts"],
        skill: nextjsDeveloperSkill.id,
        checks: "App Router 路由树、嵌套布局、parallel/intercepting routes",
        output: "路由架构审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-nextjs-developer-2",
        triggers: ["fetch", "cache", "revalidate", "unstable_cache"],
        skill: nextjsDeveloperSkill.id,
        checks: "数据获取策略、ISR、缓存分层、按路径/标签重验证",
        output: "缓存策略审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-react-server-components",
        triggers: ["\"use client\"", "\"use server\"", "server only"],
        skill: reactServerComponentsSkill.id,
        checks: "Server/Client 边界、Server Actions 安全、敏感数据泄漏",
        output: "RSC 边界审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-react-hooks",
        triggers: ["useEffect", "useState", "useCallback"],
        skill: reactHooksSkill.id,
        checks: "依赖完整性、cleanup、stale closure、条件调用",
        output: "Hooks 审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-react-performance",
        triggers: ["memo"],
        skill: reactPerformanceSkill.id,
        checks: "重渲染链、memoization 策略、bundle 分割",
        output: "性能审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-react-composable-components",
        triggers: ["大组件", "多 props", "组件拆分"],
        skill: reactComposableComponentsSkill.id,
        checks: "compound components、props 透传、职责分离",
        output: "组件架构建议",
      }),
      defineAgentWorkflowRoute({
        id: "route-typescript-type-safety",
        triggers: ["any"],
        skill: typescriptTypeSafetySkill.id,
        checks: "类型安全、any 清理、边界合同",
        output: "类型审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-nextjs-developer-3",
        triggers: ["next.config", "vercel.json"],
        skill: nextjsDeveloperSkill.id,
        checks: "Edge Runtime 限制、部署适配、环境变量",
        output: "部署审计",
      }),
    ],
    finalSteps: [
      defineAgentWorkflowStep({
        id: "final-1",
        label: "门禁：nextjs-developer → react-server-components → 确认基线",
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
        label: "排序：安全（Server Actions/RSC 边界） > 正确性 > 影响面 > 执行成本",
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
      id: nextjsDeveloperSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 App Router 路由树、缓存策略和部署配置。",
    },
    {
      id: reactServerComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计 Server/Client 边界和 Server Actions 安全。",
    },
    {
      id: reactHooksSkill.id,
      mode: SkillUseMode.Preload,
      reason: "检查 Hooks 依赖完整性、cleanup 和闭包陷阱。",
    },
    {
      id: reactPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计重渲染链和 memoization 策略。",
    },
    {
      id: reactComposableComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "评估组件拆分和职责分离合理性。",
    },
    {
      id: typescriptTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计类型安全和 any 清理情况。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
