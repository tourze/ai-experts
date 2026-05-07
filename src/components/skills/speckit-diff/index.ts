import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const speckitDiffSkill = defineSkill({
  id: "speckit-diff",
  fullName: "Speckit Diff",
  description: "当用户要比较规格文档、计划文档或任务文档的版本差异、semantic diff、scope impact 或 test impact 时使用。",
  useCases: [
    "当用户要比较规格文档、计划文档或任务文档的版本差异、semantic diff、scope impact 或 test impact 时使用。",
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
      `参数解析：
   - 两个路径：直接比较
   - 一个路径：与 \`HEAD\` 比较
   - 无参数：定位当前 feature 的 \`spec.md\` 与 \`HEAD\` 比较`,
      "读取新旧版本内容。",
      "按章节输出语义差异：新增、删除、修改、重排。",
      "对每项变化给出影响判断：需求范围/技术成本/测试影响。",
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "文档差异报告：汇总新增、删除、修改数量。",
      "章节明细：章节名、变化说明、对需求范围/技术成本/测试影响的判断。",
    ],
  }),
  tools: [],
});
