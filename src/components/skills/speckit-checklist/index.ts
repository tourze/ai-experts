import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const speckitChecklistSkill = defineSkill({
  id: "speckit-checklist",
  description: "当用户要为当前特性建立需求质量 checklist、验收问题或安全性能兼容性检查项时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for speckit-checklist.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
