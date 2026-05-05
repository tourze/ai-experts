import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const customerJourneyMapSkill = defineSkill({
  id: "customer-journey-map",
  fullName: "用户旅程地图",
  description:
    "当用户需要绘制用户旅程地图、触点链路、情绪曲线，做 Mom Test 客户访谈验证需求，或设计 NPS/PMF 调研问卷时使用（旅程可视化层）。客户研究与 persona 构建用 `customer-research`；UX 设计输入用 `ux-researcher-designer`。",
  useCases: [
    "需要分析从认知到留存的完整体验链路，定位关键阻塞点。",
    "需要把访谈、问卷或支持工单转为旅程结构时，可配合 [Mom Test 访谈](references/mom-test.md) 与 [问卷设计](references/designing-surveys.md)。",
  ],
  constraints: [
    "旅程必须绑定具体 persona 与目标任务，不能写成“所有用户的通用流程”。",
    "每个阶段至少写清触点、用户心智、阻力、指标与改进机会。",
    "不要把组织内流程当成用户旅程；用户看不见的内部步骤应单独记录。",
  ],
  checklist: [
    "Persona、阶段定义和核心目标已明确。",
    "关键触点、情绪变化、流失点和机会点都有证据来源。",
    "已说明哪些问题值得优先解决，以及为什么。",
    "输出可以直接衔接需求、实验或服务改造。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "内部 SOP 当旅程",
      pass: "用户视角",
    }),
    defineAntiPattern({
      fail: "所有阶段都是问题",
      pass: "量化 + 排序",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "designing-surveys",
      source: new URL("./references/designing-surveys.md", import.meta.url),
      target: "references/designing-surveys.md",
      title: "designing-surveys.md",
      summary: "用户调研问卷设计方法论：问题类型、量表选择与偏差控制。",
      loadWhen:
        "需要设计用户调研问卷或验证现有问卷设计质量时读取。",
    }),
    defineReference({
      id: "mom-test",
      source: new URL("./references/mom-test.md", import.meta.url),
      target: "references/mom-test.md",
      title: "mom-test.md",
      summary: "Mom Test 用户访谈法：避免虚假正面反馈、挖掘真实需求的提问技巧。",
      loadWhen:
        "需要开展客户访谈或验证需求假设时读取。",
    }),
  ],
});
