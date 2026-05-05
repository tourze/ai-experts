import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
