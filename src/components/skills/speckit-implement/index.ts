import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitImplementSkill = defineSkill({
  id: "speckit-implement",
  fullName: "Speckit Implement",
  description: "当用户要依据 tasks.md 执行实现、逐项验证任务状态或控制规格驱动交付回归风险时使用。",
  useCases: [
    "当用户要依据 tasks.md 执行实现、逐项验证任务状态或控制规格驱动交付回归风险时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
    "禁止用吞异常或放宽校验来掩盖根因。",
    "禁止未验证即宣称完成。",
    "在不破坏既有能力的前提下完成任务，保持实现与 spec/plan 对齐。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    title: "执行协议",
    steps: [
      "先读 `tasks.md`，按依赖顺序执行。",
      `每个任务先做影响半径分析：
   - 被改函数/模块
   - 调用方数量
   - 回归风险等级`,
      "先补或确认可复现验证（测试/脚本），再改实现。",
      "每次只改一个逻辑单元并立即验证。",
      `输出任务完成状态：
   - 已完成
   - 阻塞原因
   - 下一步建议`,
    ],
  }),
});
