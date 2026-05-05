import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const competitiveIntelligenceSkill = defineSkill({
  id: "competitive-intelligence",
  fullName: "竞品情报",
  description: "当用户要做竞品情报、battlecard、功能差距分析、市场定位、竞品深度拆解或竞争态势判断时使用。",
  useCases: [
    "基础档：竞品动态跟踪、battlecard、功能差距分析、市场定位。",
    "高级档：多框架交叉验证（Porter 五力 + SWOT + BCG + Blue Ocean 等），避免单一框架盲区。",
    "先做广度扫描，再决定是否进入[竞品深度拆解](references/competitive-teardown.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "competitive-teardown",
      source: new URL("./references/competitive-teardown.md", import.meta.url),
      target: "references/competitive-teardown.md",
      title: "competitive-teardown.md",
      summary: "Reference material for competitive-intelligence.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "multi-framework-output-template",
      source: new URL("./references/multi-framework-output-template.md", import.meta.url),
      target: "references/multi-framework-output-template.md",
      title: "multi-framework-output-template.md",
      summary: "Reference material for competitive-intelligence.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "obviously-awesome",
      source: new URL("./references/obviously-awesome.md", import.meta.url),
      target: "references/obviously-awesome.md",
      title: "obviously-awesome.md",
      summary: "Reference material for competitive-intelligence.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
