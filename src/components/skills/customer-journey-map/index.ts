import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
      summary: "Reference material for customer-journey-map.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mom-test",
      source: new URL("./references/mom-test.md", import.meta.url),
      target: "references/mom-test.md",
      title: "mom-test.md",
      summary: "Reference material for customer-journey-map.",
      loadWhen:
        "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
