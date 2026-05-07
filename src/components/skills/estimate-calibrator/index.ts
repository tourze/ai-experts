import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const estimateCalibratorSkill = defineSkill({
  id: "estimate-calibrator",
  fullName: "估算校准",
  description: "当用户要做三点估算、工作量校准、PERT 区间或不确定性说明时使用；输出最佳/最可能/最差估算、未知项与置信度说明。",
  useCases: [
    "研发排期、路线图沟通、项目承诺、Story points 或任务规模评估。",
    "需要参考 [references/estimation-methods.md](references/estimation-methods.md)、[references/sizing-heuristics.md](references/sizing-heuristics.md)、[references/unknown-categories.md](references/unknown-categories.md)。",
    "需要把估算结论转换为排期沟通材料、缓冲建议或风险说明。",
  ],
  constraints: [
    "先拆工作，再估时间；没有边界定义的任务不要直接给单点数值。",
    "估算必须显式写出假设、未知项和最坏情况，不允许只报“乐观值”。",
    "估算不等于承诺，区间越窄越需要证据支撑。",
  ],
  checklist: [
    "工作已拆到可讨论的不确定性粒度。",
    "已给出三点估算、风险来源和置信度说明。",
    "关键依赖、外部等待和返工概率已纳入。",
    "结果能支撑排期决策，而不是制造虚假确定性。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "含糊需求精确估",
      pass: "拆 + 三点估算",
    }),
    defineAntiPattern({
      fail: "只报乐观值",
      pass: "显式区间 + 假设",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先界定范围、交付物、完成定义和外部依赖；边界不清时先澄清。",
      "把工作拆成可独立讨论的不确定性单元，避免对大块需求报单点数值。",
      "为每项给出 Best / Likely / Worst，并写明主要未知项、风险来源和假设。",
      "按历史数据或类比案例校准估算；需要方法时读取 `estimation-methods`、`sizing-heuristics` 或 `unknown-categories` references。",
      "输出区间、置信度、缓冲建议和需要先验证的未知项。",
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "估算表列：工作项、Best、Likely、Worst、主要未知项。",
    ],
  }),
  references: [
    defineReference({
      id: "calibration-tips",
      source: new URL("./references/calibration-tips.md", import.meta.url),
      target: "references/calibration-tips.md",
      title: "calibration-tips.md",
      summary: "估算校准的实用技巧，包括历史数据校准和偏差修正方法。",
      loadWhen: "需要根据历史数据校准估算偏差或提高估算精度时读取。",
    }),
    defineReference({
      id: "estimation-methods",
      source: new URL("./references/estimation-methods.md", import.meta.url),
      target: "references/estimation-methods.md",
      title: "estimation-methods.md",
      summary: "多种工作量估算方法（PERT、三点估算、类比估算等）的详细说明与适用场景。",
      loadWhen: "需要选择适当的估算方法或对比不同估算技术时读取。",
    }),
    defineReference({
      id: "sizing-heuristics",
      source: new URL("./references/sizing-heuristics.md", import.meta.url),
      target: "references/sizing-heuristics.md",
      title: "sizing-heuristics.md",
      summary: "任务规模评估的启发式规则，用于快速判断工作量和复杂度。",
      loadWhen: "需要在任务拆解后快速评估各模块的相对规模时读取。",
    }),
    defineReference({
      id: "unknown-categories",
      source: new URL("./references/unknown-categories.md", import.meta.url),
      target: "references/unknown-categories.md",
      title: "unknown-categories.md",
      summary: "估算中未知项的分类体系（已知已知/已知未知/未知未知）与处理方法。",
      loadWhen: "需要识别和分类估算中的不确定性来源或管理未知风险时读取。",
    }),
  ],
});
