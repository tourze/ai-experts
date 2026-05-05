import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const androidRedexSkill = defineSkill({
  id: "android-redex",
  description: "当用户要用 ReDex 优化 Android APK 体积/性能、配置 pass 或排查优化问题时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "installation",
      source: new URL("./references/installation.md", import.meta.url),
      target: "references/installation.md",
      title: "installation.md",
      summary: "Reference material for android-redex.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "passes",
      source: new URL("./references/passes.md", import.meta.url),
      target: "references/passes.md",
      title: "passes.md",
      summary: "Reference material for android-redex.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "troubleshooting",
      source: new URL("./references/troubleshooting.md", import.meta.url),
      target: "references/troubleshooting.md",
      title: "troubleshooting.md",
      summary: "Reference material for android-redex.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for android-redex.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
