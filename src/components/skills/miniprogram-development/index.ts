import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const miniprogramDevelopmentSkill = defineSkill({
  id: "miniprogram-development",
  description: "当用户提到微信小程序、小程序页面、组件、project.config.json、appid、真机预览、miniprogram-ci、CloudBase 或 wx.cloud 时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "cloudbase-integration",
      source: new URL("./references/cloudbase-integration.md", import.meta.url),
      target: "references/cloudbase-integration.md",
      title: "cloudbase-integration.md",
      summary: "Reference material for miniprogram-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "devtools-debug-preview",
      source: new URL("./references/devtools-debug-preview.md", import.meta.url),
      target: "references/devtools-debug-preview.md",
      title: "devtools-debug-preview.md",
      summary: "Reference material for miniprogram-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for miniprogram-development.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
