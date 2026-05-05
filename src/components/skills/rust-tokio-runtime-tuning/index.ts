import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const rustTokioRuntimeTuningSkill = defineSkill({
  id: "rust-tokio-runtime-tuning",
  description: "当用户需要调优 Tokio 运行时配置时使用；涉及 Runtime::builder、worker 线程数、blocking 线程池或 current_thread 时触发。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for rust-tokio-runtime-tuning.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-tokio-runtime-tuning.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
