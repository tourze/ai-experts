import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const appleAppstoreReviewerSkill = defineSkill({
  id: "apple-appstore-reviewer",
  description: "当用户要从 App Store 审核视角审查 iOS/macOS 应用、识别拒审风险或准备提审材料时使用。",
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
      summary: "Eval cases for apple-appstore-reviewer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
