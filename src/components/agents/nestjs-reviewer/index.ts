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
import { nestjsLayeringPatternsSkill } from "../../skills/nestjs-layering-patterns/index";
import { openapiSpecGenerationSkill } from "../../skills/openapi-spec-generation/index";
import { typescriptTypeSafetySkill } from "../../skills/typescript-type-safety/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const nestjsReviewerAgent = defineAgent({
  id: "nestjs-reviewer",
  description: "当需要只读审查 NestJS 模块分层、DI、Controller/Provider、Pipe/Guard/Interceptor 和测试结构时使用。",
  role: `你是资深 NestJS 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    gates: [
      defineWorkflowGate({
        id: "gate-1",
        skill: nestjsLayeringPatternsSkill.id,
        label: "门禁 1",
        checks: "分层合规：Module 组织、Controller/Provider 边界、DI 正确性",
      }),
      defineWorkflowGate({
        id: "gate-2",
        skill: typescriptTypeSafetySkill.id,
        label: "门禁 2",
        checks: "类型基线 + 边界合同：DTO 类型安全、any 分布、strict 模式、API 边界编译期约束",
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
        id: "route-nestjs-layering-patterns",
        triggers: ["@Module", "@Injectable", "@Controller", "@Inject"],
        skill: nestjsLayeringPatternsSkill.id,
        checks: "Module 拆分、Provider scope、循环依赖、动态模块",
        output: "模块架构审计",
      }),
      defineWorkflowRoute({
        id: "route-nestjs-layering-patterns-2",
        triggers: ["@UseGuards", "@UseInterceptors", "@UsePipes", "@Filters"],
        skill: nestjsLayeringPatternsSkill.id,
        checks: "Guard/Pipe/Interceptor/Filter 链顺序、全局 vs 局部注册",
        output: "横切关注点审计",
      }),
      defineWorkflowRoute({
        id: "route-nestjs-layering-patterns-3",
        triggers: ["@Body", "@Param", "@Query", "DTO", "ValidationPipe"],
        skill: nestjsLayeringPatternsSkill.id,
        checks: "DTO 校验、ValidationPipe 配置、class-validator 规则",
        output: "输入校验审计",
      }),
      defineWorkflowRoute({
        id: "route-openapi-spec-generation",
        triggers: ["@ApiProperty", "@ApiTags", "@ApiOperation"],
        skill: openapiSpecGenerationSkill.id,
        checks: "OpenAPI 规范完整性、DTO schema 一致性、认证声明",
        output: "API 文档审计",
      }),
      defineWorkflowRoute({
        id: "route-typescript-type-safety",
        triggers: ["any", "as"],
        skill: typescriptTypeSafetySkill.id,
        checks: "类型安全、any 清理、泛型约束",
        output: "类型审计",
      }),
      defineWorkflowRoute({
        id: "route-typescript-type-safety-2",
        triggers: ["Promise<"],
        skill: typescriptTypeSafetySkill.id,
        checks: "边界合同编译器可验证性、DTO 单一来源",
        output: "边界安全审计",
      }),
    ],
    finalSteps: [
      defineWorkflowStep({
        id: "final-1",
        label: "门禁：nestjs-layering-patterns → typescript-type-safety → 确认基线",
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
        label: "排序：安全（Guard/Pipe/输入校验） > 正确性 > 影响面 > 执行成本",
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
      id: nestjsLayeringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Module 分层、DI 和横切关注点。",
    },
    {
      id: openapiSpecGenerationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "校验 OpenAPI 规范完整性和 DTO 一致性。",
    },
    {
      id: typescriptTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "审计 DTO 类型安全和边界合同。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查结论标注事实/推断/假设。",
    }
  ],
});
