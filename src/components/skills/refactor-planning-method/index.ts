import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { complexityReducerSkill } from "../complexity-reducer/index";
import { refactoringChecklistSkill } from "../refactoring-checklist/index";
import { softwareDesignSkill } from "../software-design/index";

export const refactorPlanningMethodSkill = defineSkill({
  id: "refactor-planning-method",
  fullName: "重构计划方法论",
  description: "当需要为既有代码制定系统化重构计划时使用；提供基线建立、多视角问题验证、接缝识别和增量拆步的完整方法论。",
  useCases: [
    "当需要为既有代码制定系统化重构计划时使用；提供基线建立、多视角问题验证、接缝识别和增量拆步的完整方法论。",
  ],
  constraints: [
    "不凭直觉重构：没有多视角交叉验证的问题不进拆步计划。",
    "不跳过测试基线：无测试的模块先补测试再重构。",
    "不做不可逆大改：每步必须可独立 revert。",
    "不改行为：重构不改变外部可观测行为；行为变更走 feature 分支。",
    "执行时遵循正文中的流程、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  checklist: [
    "已建立测试覆盖、依赖图、热点文件和坏味分布基线。",
    "每个真问题至少被两个视角交叉验证。",
    "每个边界都标记了安全度、测试保护度和影响半径。",
    "每个拆步都有输入、预期输出、验证命令和回滚方式。",
    "计划明确列出不做的事和已知风险。",
  ],
  relatedSkills: [
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "需要从深模块、信息隐藏、复杂度投资或职责边界判断重构问题是否成立时联动。",
    },
    {
      get id() {
        return complexityReducerSkill.id;
      },
      reason: "需要用圈复杂度、嵌套深度或认知负载度量验证复杂度问题时联动。",
    },
    {
      get id() {
        return refactoringChecklistSkill.id;
      },
      reason: "计划进入执行前需要测试基线、范围界定、回滚和提交纪律门禁时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "凭直觉认定代码很乱，直接开始拆。",
      pass: "先建立基线，用至少两个视角交叉验证真问题。",
    }),
    defineAntiPattern({
      fail: "把多个不可独立验证的重构动作塞进一个大计划。",
      pass: "拆成每步可运行、可测试、可单独 revert 的增量步骤。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为既有代码制定系统化重构计划，先建立基线并多视角验证真问题，再识别安全边界和可回滚拆步。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先建立基线：测试覆盖、依赖拓扑、热点文件和坏味分布。",
      "用至少两个视角交叉验证问题，避免把单一偏好当成重构理由。",
      "标记可安全推进的边界，评估测试保护度、影响半径和回滚成本。",
      "把计划拆成可独立验证的步骤，并列出不做的事、风险和验证命令。",
      "四步法、输出模板和拆步示例读取 `planning-method`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试覆盖、依赖拓扑、热点文件、坏味分布等重构基线。",
      "多视角验证后的真问题清单、影响半径和可推进边界。",
      "拆步计划、验证命令、回滚方式、不做事项和风险缓解。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "planning-method",
      source: new URL("./references/planning-method.md", import.meta.url),
      target: "references/planning-method.md",
      title: "重构计划四步法",
      summary: "基线建立、多视角交叉验证、边界识别、增量拆步和输出模板。",
      loadWhen: "需要制定系统化重构计划或输出拆步表时读取。",
    }),
  ],
});
