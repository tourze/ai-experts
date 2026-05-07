import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { architectureDecisionRecordsSkill } from "../architecture-decision-records/index";
import { errorHandlingPatternsSkill } from "../error-handling-patterns/index";
import { protocolFreezingPatternsSkill } from "../protocol-freezing-patterns/index";
import { softwareDesignSkill } from "../software-design/index";
import { systemDesignSkill } from "../system-design/index";
import { taskDecomposerSkill } from "../task-decomposer/index";

export const architectureDesignWorkflowSkill = defineSkill({
  id: "architecture-design-workflow",
  fullName: "架构设计工作流",
  description: "当需要端到端推进架构设计、组织可评审方案或把零散设计想法收敛成架构文档时使用；单个 ADR 改用 `architecture-decision-records`，概念性系统设计改用 `system-design`。",
  useCases: [
    "需要从零到一完成架构设计并产出文档。",
    "需要系统化推进架构评审，避免遗漏关键假设。",
    "已有零散设计想法，需要结构化组织成可评审方案。",
  ],
  constraints: [
    "阶段 1 未完成不准跳到阶段 2。没有量化约束的设计方案是无根方案。",
    "每个架构决策必须有 Consequences 段。没有后果分析的 ADR 不算完成。",
    "不写\"视情况而定\"——要么给具体值，要么标注 [假设] 并附降级路径。",
    "执行时遵循正文中的流程、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  relatedSkills: [
    {
      get id() {
        return systemDesignSkill.id;
      },
      reason: "架构全貌方法论：需要理解系统架构的整体设计方法和原则时联动。",
    },
    {
      get id() {
        return architectureDecisionRecordsSkill.id;
      },
      reason: "ADR 格式与系统边界分析：需要记录架构决策或分析系统边界时联动。",
    },
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "模块设计与设计原则：需要深入模块设计或应用设计原则时联动。",
    },
    {
      get id() {
        return protocolFreezingPatternsSkill.id;
      },
      reason: "协议版本冻结：需要设计版本化协议或兼容策略时联动。",
    },
    {
      get id() {
        return errorHandlingPatternsSkill.id;
      },
      reason: "错误分层与传播：需要设计错误处理策略或错误传播路径时联动。",
    },
    {
      get id() {
        return taskDecomposerSkill.id;
      },
      reason: "任务拆解与关键路径：需要将架构方案拆解为可执行任务时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "阶段 1 需求澄清：确认功能边界、量化约束、既有系统和非目标；缺数字标 `[待确认]` 并说明影响。",
      "阶段 2 先画高层架构：服务/组件边界、部署拓扑、数据流方向，优先用 ASCII 框图表达。",
      "对每个关键选择写 ADR：Context、Decision、Consequences、trade-off 和假设不成立时降级路径。",
      "定义接口契约：API 风格、版本策略、错误码、认证模型和兼容策略。",
      "设计数据模型：实体关系、读写路径、事件流、存储选型和一致性边界。",
      "定义弹性策略：故障模式、降级、超时、重试、熔断的具体数值。",
      "阶段 3 拆实施计划：2-4 个阶段，每阶段有验收标准、未验证项、风险、缓解和触发条件。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "架构设计文档：目标约束、非目标、高层架构、关键 ADR、接口契约、数据模型与流。",
      "弹性与运维：故障模式、降级、监控、告警、超时/重试/熔断具体值。",
      "落地计划：阶段、范围、验收标准、假设与未验证项、风险、缓解和触发条件。",
    ],
  }),
});
