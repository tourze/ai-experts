import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { errorHandlingPatternsSkill } from "../error-handling-patterns/index";
import { protocolFreezingPatternsSkill } from "../protocol-freezing-patterns/index";
import { softwareDesignSkill } from "../software-design/index";
import { systemDesignSkill } from "../system-design/index";

export const architectureDecisionRecordsSkill = defineSkill({
  id: "architecture-decision-records",
  fullName: "架构决策记录与系统边界分析",
  description:
    "当用户需要为架构决策写 ADR、做系统边界分析（服务划分/数据所有权/一致性边界）、设计接口契约（版本策略/向后兼容/breaking change 流程）、管理复杂度（深模块/信息隐藏）或制定弹性策略（超时/重试/熔断/降级）时使用。与 system-design 互补：后者给架构全貌，本 skill 给决策方法与契约模板。",
  useCases: [
    "需要把架构决策写成 ADR（Architecture Decision Record）格式",
    "系统边界模糊：服务该拆还是该合、数据归谁、一致性怎么保证",
    "接口需要版本策略和 breaking change 治理流程",
    '方案评审时需要显式写 trade-off，不用"最佳实践"搪塞',
    "弹性策略设计：超时、重试、熔断、降级的边界和组合",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  checklist: [
    "每个决策有显式的 Context → Decision → Consequences。",
    '抛弃的选项和理由已记录，不在 ADR 中留"唯一方案"。',
    "服务边界分析覆盖了数据所有权、变更节奏和弹性需求三个维度。",
    "对外 API 有明确的版本策略和 breaking change 流程。",
    '超时/重试/熔断/降级有具体数值，不是"设一个合理的值"。',
    "关键假设标注了不成立时的降级路径。",
  ],
  relatedSkills: [
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "`software-design`：模块内职责拆分与设计原则。",
    },
    {
      get id() {
        return protocolFreezingPatternsSkill.id;
      },
      reason: "`protocol-freezing-patterns`：线格式版本冻结与兼容。",
    },
    {
      get id() {
        return errorHandlingPatternsSkill.id;
      },
      reason: "`error-handling-patterns`：错误分层与传播。",
    },
    {
      get id() {
        return systemDesignSkill.id;
      },
      label: "`system-design`",
      reason: "``system-design``：系统架构全貌设计",
    },
    {
      get id() {
        return softwareDesignSkill.id;
      },
      label: "`software-design`",
      reason: "``software-design``：模块内职责拆分与设计原则",
    },
    {
      get id() {
        return protocolFreezingPatternsSkill.id;
      },
      label: "`protocol-freezing-patterns`",
      reason: "``protocol-freezing-patterns``：线格式版本冻结与兼容",
    },
    {
      get id() {
        return errorHandlingPatternsSkill.id;
      },
      label: "`error-handling-patterns`",
      reason: "``error-handling-patterns``：错误分层与传播",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "contract-templates",
      source: new URL("./references/contract-templates.md", import.meta.url),
      target: "references/contract-templates.md",
      title: "contract-templates.md",
      summary: "ADR 模板、决策记录格式与 Y 语句编写规范。",
      loadWhen:
        "需要创建或审查架构决策记录时读取。",
    }),
  ],
});
