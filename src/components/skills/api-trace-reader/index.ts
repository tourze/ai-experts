import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const apiTraceReaderSkill = defineSkill({
  id: "api-trace-reader",
  fullName: "api-trace-reader",
  description: "在需要只读追踪接口、任务、事件或定时任务的调用链时使用。",
  useCases: [
    "当用户问“这个接口都干了什么”“什么情况会触发”“帮我串一下调用链”时使用。",
    "适合定位数据库写入、缓存变更、消息投递、定时任务和事件监听的真实来源。",
    "交叉引用：若要做系统级问题盘点，配合 `architecture-reviewer`（Exhaustive 模式）；若要审方案而不是追链路，改用 `plan-review`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "entry-types",
      source: new URL("./references/entry-types.md", import.meta.url),
      target: "references/entry-types.md",
      title: "entry-types.md",
      summary: "Reference material for api-trace-reader.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "output-example",
      source: new URL("./references/output-example.md", import.meta.url),
      target: "references/output-example.md",
      title: "output-example.md",
      summary: "Reference material for api-trace-reader.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "risk-rubric",
      source: new URL("./references/risk-rubric.md", import.meta.url),
      target: "references/risk-rubric.md",
      title: "risk-rubric.md",
      summary: "Reference material for api-trace-reader.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
