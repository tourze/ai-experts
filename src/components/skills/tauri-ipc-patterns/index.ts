import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const tauriIpcPatternsSkill = defineSkill({
  id: "tauri-ipc-patterns",
  description: "当用户需要高级 IPC 模式、自定义错误、判别联合事件、Channel<T> 流、多窗口路由、二进制传输或批量命令时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ipc-advanced-patterns",
      source: new URL("./references/ipc-advanced-patterns.md", import.meta.url),
      target: "references/ipc-advanced-patterns.md",
      title: "ipc-advanced-patterns.md",
      summary: "Reference material for tauri-ipc-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for tauri-ipc-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
