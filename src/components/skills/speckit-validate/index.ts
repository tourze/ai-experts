import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitValidateSkill = defineSkill({
  id: "speckit-validate",
  fullName: "Speckit Validate",
  description: "当用户要验证实现是否满足规格、计划、任务、验收标准或边界条件时使用。",
  useCases: [
    "当用户要验证实现是否满足规格、计划、任务、验收标准或边界条件时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "读取：`spec.md`、`plan.md`、`tasks.md`。",
      `构建需求矩阵：
   - 功能需求
   - 验收标准
   - 边界条件`,
      "扫描实现与测试，建立“需求 → 代码/测试”映射。",
      `识别缺口：
   - 未实现需求
   - 不可验证需求
   - 未覆盖边界条件`,
      "输出验证结论：PASS / PARTIAL / FAIL。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "验证矩阵",
      "缺口清单",
      "最小补救建议",
    ],
  }),
  tools: [],
});
