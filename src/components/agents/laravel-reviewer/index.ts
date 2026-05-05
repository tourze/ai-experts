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
import { laravelPatternsSkill } from "../../skills/laravel-patterns/index";
import { laravelSecuritySkill } from "../../skills/laravel-security/index";
import { laravelVerificationSkill } from "../../skills/laravel-verification/index";
import { laravelTddSkill } from "../../skills/laravel-tdd/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const laravelReviewerAgent = defineAgent({
  id: "laravel-reviewer",
  description: "当需要只读审查 Laravel 分层、Eloquent、Validation、Authorization、Migration 和 Queue 时使用。",
  role: `你是资深 Laravel 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineAgentWorkflow({
    direction: "TD",
    gates: [
      defineAgentWorkflowGate({
        id: "gate-1",
        skill: laravelVerificationSkill.id,
        label: "门禁 1",
        checks: "发版前自检：composer audit、phpstan、pint、migration 可逆性",
      }),
      defineAgentWorkflowGate({
        id: "gate-2",
        skill: laravelSecuritySkill.id,
        label: "门禁 2",
        checks: "安全红线：Sanctum/Policy 覆盖、FormRequest 校验、文件上传、XSS/CSRF",
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
        id: "route-laravel-patterns",
        triggers: ["Controller", "FormRequest", "Service", "Action", "Job"],
        skill: laravelPatternsSkill.id,
        checks: "分层责任边界、Service/Action 粒度、scopeBindings、多租户路由",
        output: "分层审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-laravel-patterns-2",
        triggers: ["Model", "HasMany", "BelongsTo", "scope", "$casts"],
        skill: laravelPatternsSkill.id,
        checks: "Eloquent 关系、N+1 预加载、mass assignment、casts、observer",
        output: "Eloquent 审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-laravel-security",
        triggers: ["Policy", "Gate", "middleware", "$this->authorize"],
        skill: laravelSecuritySkill.id,
        checks: "对象级权限覆盖、Policy 自动发现、middleware 链",
        output: "授权审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-laravel-patterns-3",
        triggers: ["Migration", "Queue", "Job", "dispatch", "ShouldQueue"],
        skill: laravelPatternsSkill.id,
        checks: "migration 可逆性、大表锁、queue 幂等性、失败恢复、retry",
        output: "基础设施审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-laravel-tdd",
        triggers: ["@test", "Pest", "RefreshDatabase", "Queue::fake"],
        skill: laravelTddSkill.id,
        checks: "测试隔离、HTTP fake、Queue/Event fake、数据库 trait",
        output: "测试质量审计",
      }),
    ],
    finalSteps: [
      defineAgentWorkflowStep({
        id: "final-1",
        label: "门禁：laravel-verification → laravel-security → 确认基线干净",
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
        label: "排序：安全（Policy/Gate/XSS） > 数据完整性 > 影响面 > 执行成本",
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
      reason: codeReviewAgentFrameworkSkill.description,
    },
    {
      id: laravelPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelPatternsSkill.description,
    },
    {
      id: laravelSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelSecuritySkill.description,
    },
    {
      id: laravelVerificationSkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelVerificationSkill.description,
    },
    {
      id: laravelTddSkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelTddSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
