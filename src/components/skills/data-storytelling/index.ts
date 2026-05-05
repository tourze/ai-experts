import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const dataStorytellingSkill = defineSkill({
  id: "data-storytelling",
  fullName: "data-storytelling",
  description: "当用户要把数据分析结果转成业务叙事、executive narrative、KPI storyline、洞察结论、建议路径或汇报口径时使用。",
  useCases: [
    "已经有分析结果，但用户真正需要的是“怎么讲清楚”“怎么组织成报告或汇报”。",
    "需要把大量指标压缩成 headline、关键洞察、风险、建议、下一步动作。",
    "需要给周报、月报、复盘、董事会材料或项目结论页设计叙事顺序。",
    "相关 skill：[data-analysis](../data-analysis/SKILL.md)、[data-visualization](../data-visualization/SKILL.md)、[statistical-analysis](../statistical-analysis/SKILL.md)。",
    "需要使用 T8 内联标注语法为文本嵌入机读实体时，参考 [references/t8-syntax.md](references/t8-syntax.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "t8-syntax",
      source: new URL("./references/t8-syntax.md", import.meta.url),
      target: "references/t8-syntax.md",
      title: "t8-syntax.md",
      summary: "Reference material for data-storytelling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
