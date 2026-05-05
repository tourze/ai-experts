import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const estimateCalibratorSkill = defineSkill({
  id: "estimate-calibrator",
  fullName: "估算校准",
  description: "当用户要做三点估算、工作量校准、PERT 区间或不确定性说明时使用；输出最佳/最可能/最差估算、未知项与置信度说明。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "calibration-tips",
      source: new URL("./references/calibration-tips.md", import.meta.url),
      target: "references/calibration-tips.md",
      title: "calibration-tips.md",
      summary: "Reference material for estimate-calibrator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "estimation-methods",
      source: new URL("./references/estimation-methods.md", import.meta.url),
      target: "references/estimation-methods.md",
      title: "estimation-methods.md",
      summary: "Reference material for estimate-calibrator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "sizing-heuristics",
      source: new URL("./references/sizing-heuristics.md", import.meta.url),
      target: "references/sizing-heuristics.md",
      title: "sizing-heuristics.md",
      summary: "Reference material for estimate-calibrator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "unknown-categories",
      source: new URL("./references/unknown-categories.md", import.meta.url),
      target: "references/unknown-categories.md",
      title: "unknown-categories.md",
      summary: "Reference material for estimate-calibrator.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for estimate-calibrator.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
