import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { dataAnalysisSkill } from "../data-analysis/index";
import { dataVisualizationSkill } from "../data-visualization/index";
import { statisticalAnalysisSkill } from "../statistical-analysis/index";

export const dataStorytellingSkill = defineSkill({
  id: "data-storytelling",
  fullName: "data-storytelling",
  description: "当用户要把数据分析结果转成业务叙事、executive narrative、KPI storyline、洞察结论、建议路径或汇报口径时使用。",
  useCases: [
    "已经有分析结果，但用户真正需要的是“怎么讲清楚”“怎么组织成报告或汇报”。",
    "需要把大量指标压缩成 headline、关键洞察、风险、建议、下一步动作。",
    "需要给周报、月报、复盘、董事会材料或项目结论页设计叙事顺序。",
    "需要使用 T8 内联标注语法为文本嵌入机读实体时，参考 [references/t8-syntax.md](references/t8-syntax.md)。",
  ],
  constraints: [
    "先确认“想让谁做什么”，再决定故事结构；没有目标受众就没有叙事。",
    "一个故事只保留 1 个主结论和 2 到 4 个支撑点，避免把所有图表原样堆上去。",
    "结论必须能回指具体数据证据；需要时引用 `data-analysis` 或 `statistical-analysis` 的结果。",
    "建议先写 headline，再补证据，再给行动项，不要反过来。",
  ],
  checklist: [
    "主结论是否能在 1 句话里说清楚。",
    "每个支撑点是否都有数字证据，而不是形容词。",
    "是否明确说明了不确定性、样本边界或统计限制。",
    "是否知道这份材料最终要驱动哪个动作。",
  ],
  relatedSkills: [
    {
      get id() {
        return dataAnalysisSkill.id;
      },
      reason: "结论必须能回指具体数据证据；需要时引用 `data-analysis` 或 `statistical-analysis` 的结果。",
    },
    {
      get id() {
        return dataVisualizationSkill.id;
      },
      reason: "相关 skill：`data-analysis`、`data-visualization`、`statistical-analysis`。",
    },
    {
      get id() {
        return statisticalAnalysisSkill.id;
      },
      reason: "结论必须能回指具体数据证据；需要时引用 `data-analysis` 或 `statistical-analysis` 的结果。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "dashboard 截图当报告",
      pass: "结论先行 + 行动项",
    }),
    defineAntiPattern({
      fail: "形容词堆砌",
      pass: "量化 + 基线",
    }),
    defineAntiPattern({
      fail: "因果相关混说",
      pass: "显式标注证据强度",
    }),
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
