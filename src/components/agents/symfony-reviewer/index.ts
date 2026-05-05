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
import { doctrineBatchProcessingSkill } from "../../skills/doctrine-batch-processing/index";
import { doctrineEntityPatternsSkill } from "../../skills/doctrine-entity-patterns/index";
import { symfonyBundleArchitectureSkill } from "../../skills/symfony-bundle-architecture/index";
import { symfonyMessengerSkill } from "../../skills/symfony-messenger/index";
import { symfonyVotersSkill } from "../../skills/symfony-voters/index";
import { symfonyUxSkill } from "../../skills/symfony-ux/index";
import { twigComponentsSkill } from "../../skills/twig-components/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const symfonyReviewerAgent = defineAgent({
  id: "symfony-reviewer",
  description: "当需要只读审查 Symfony DI、Service、Doctrine、Messenger、Event、Security/Voter 和 Twig/UX 时使用。",
  role: `你是资深 Symfony 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineAgentWorkflow({
    direction: "TD",
    gates: [
      defineAgentWorkflowGate({
        id: "gate-1",
        skill: symfonyBundleArchitectureSkill.id,
        label: "门禁 1",
        checks: "DI 合规：autowiring、visibility、tag、CompilerPass、Bundle 边界",
      }),
      defineAgentWorkflowGate({
        id: "gate-2",
        skill: symfonyVotersSkill.id,
        label: "门禁 2",
        checks: "授权基线：Voter 覆盖、IsGranted 属性、权限决策矩阵",
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
        id: "route-doctrine-entity-patterns",
        triggers: ["Entity", "Repository", "#[ORM\\", "EntityManager"],
        skill: doctrineEntityPatternsSkill.id,
        checks: "Entity 设计、关联映射、repository 边界、cascade、flush in loop",
        output: "Doctrine 审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-doctrine-batch-processing",
        triggers: ["flush"],
        skill: doctrineBatchProcessingSkill.id,
        checks: "批量大小、clear 间隔、事务边界、内存峰值",
        output: "批处理优化",
      }),
      defineAgentWorkflowRoute({
        id: "route-symfony-messenger",
        triggers: ["Message", "Messenger", "dispatch", "#[AsMessageHandler]"],
        skill: symfonyMessengerSkill.id,
        checks: "幂等性、retry 配置、failure transport、消息序列化",
        output: "消息队列审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-symfony-bundle-architecture",
        triggers: ["#[AsEventListener]", "EventSubscriber", "dispatch"],
        skill: symfonyBundleArchitectureSkill.id,
        checks: "事件副作用、订阅者顺序、事件负载",
        output: "事件系统审计",
      }),
      defineAgentWorkflowRoute({
        id: "route-symfony-bundle-architecture-2",
        triggers: ["Bundle", "Extension", "CompilerPass", "config"],
        skill: symfonyBundleArchitectureSkill.id,
        checks: "Bundle 结构、DI Extension、配置发布",
        output: "Bundle 架构审查",
      }),
      defineAgentWorkflowRoute({
        id: "route-twig-components",
        triggers: ["TwigComponent", "LiveComponent", "{% component %}"],
        skill: twigComponentsSkill.id,
        checks: "组件 props、表单联动、stimulus 集成",
        output: "Twig 组件审查",
      }),
      defineAgentWorkflowRoute({
        id: "route-symfony-ux",
        triggers: ["stimulus", "turbo", "UX"],
        skill: symfonyUxSkill.id,
        checks: "Stimulus controller、Turbo frame、异步片段替换",
        output: "UX 集成审查",
      }),
    ],
    finalSteps: [
      defineAgentWorkflowStep({
        id: "final-1",
        label: "门禁：symfony-bundle-architecture → symfony-voters → 确认基线",
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
        label: "排序：安全（Voter/access_control） > 数据完整性（Doctrine） > 影响面 > 执行成本",
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
      reason: "提供代码审查通用方法论与检查清单。",
    },
    {
      id: doctrineBatchProcessingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查批量操作的内存与事务边界。",
    },
    {
      id: doctrineEntityPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Entity 映射与关联设计合规性。",
    },
    {
      id: symfonyBundleArchitectureSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Bundle 边界与 DI 配置合规性。",
    },
    {
      id: symfonyMessengerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查消息 handler 幂等性与重试策略。",
    },
    {
      id: symfonyVotersSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Voter 授权覆盖与权限矩阵完整性。",
    },
    {
      id: symfonyUxSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Stimulus/Turbo 集成与异步交互。",
    },
    {
      id: twigComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 Twig 组件 props 与 LiveComponent 联动。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条审查发现标注事实/推断/假设。",
    }
  ],
});
