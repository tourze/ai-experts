import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { competitiveIntelligenceSkill } from "../competitive-intelligence/index";
import { swotAnalysisSkill } from "../swot-analysis/index";

export const portersFiveForcesSkill = defineSkill({
  id: "porters-five-forces",
  fullName: "波特五力",
  description: "当用户要做行业吸引力分析、判断竞争压力、供应商/买方权力或替代威胁时使用；适合市场进入、战略评估和商业环境诊断。",
  useCases: [
    "新行业进入评估、市场格局判断、战略机会复盘。",
    "与内部能力/执行风险结合分析时，可配合 `swot-analysis` 或 `competitive-teardown`。",
    "补充分析框架：[references/3c-strategic-triangle.md](references/3c-strategic-triangle.md) — 3C 战略三角（客户-公司-竞争对手）；[references/strategy-clock.md](references/strategy-clock.md) — 战略钟（定价-价值定位）。",
  ],
  constraints: [
    "五力分析关注行业结构，不是单个竞争对手花活。",
    "每一力都要说明强弱原因、时间尺度和对盈利能力的影响。",
    "不要把“市场大”误当作“行业结构有利”。",
  ],
  relatedSkills: [
    {
      get id() {
        return competitiveIntelligenceSkill.id;
      },
      label: "competitive-teardown",
      reason: "与内部能力/执行风险结合分析时，可配合 `swot-analysis` 或 `competitive-teardown`。",
    },
    {
      get id() {
        return swotAnalysisSkill.id;
      },
      reason: "与内部能力/执行风险结合分析时，可配合 `swot-analysis` 或 `competitive-teardown`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "3c-strategic-triangle",
      source: new URL("./references/3c-strategic-triangle.md", import.meta.url),
      target: "references/3c-strategic-triangle.md",
      title: "3c-strategic-triangle.md",
      summary: "Reference material for porters-five-forces.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "strategy-clock",
      source: new URL("./references/strategy-clock.md", import.meta.url),
      target: "references/strategy-clock.md",
      title: "strategy-clock.md",
      summary: "Reference material for porters-five-forces.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
