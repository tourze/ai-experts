import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustTokioRuntimeTuningSkill = defineSkill({
  id: "rust-tokio-runtime-tuning",
  fullName: "Rust Tokio Runtime Tuning",
  description: "当用户需要调优 Tokio 运行时配置时使用；涉及 Runtime::builder、worker 线程数、blocking 线程池或 current_thread 时触发。",
  useCases: [
    "为服务/CLI/移动端选择合适的 runtime 配置。",
    "调整 worker 线程数、blocking 上限或栈大小。",
    "在同步代码中嵌入 async（`block_on` 桥接）。",
    "用 metrics / tokio-console 定位瓶颈。",
  ],
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
  ],
});
