import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const laravelPatternsSkill = defineSkill({
  id: "laravel-patterns",
  description: "当用户需要处理 Laravel 分层架构、Service/Action 边界、Eloquent 模型、Migration、FormRequest、JsonResource、Job、Livewire、scopeBindings、多租户路由或 N+1 问题时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "eloquent",
      source: new URL("./references/eloquent.md", import.meta.url),
      target: "references/eloquent.md",
      title: "eloquent.md",
      summary: "Reference material for laravel-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "livewire",
      source: new URL("./references/livewire.md", import.meta.url),
      target: "references/livewire.md",
      title: "livewire.md",
      summary: "Reference material for laravel-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "queues",
      source: new URL("./references/queues.md", import.meta.url),
      target: "references/queues.md",
      title: "queues.md",
      summary: "Reference material for laravel-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "routing",
      source: new URL("./references/routing.md", import.meta.url),
      target: "references/routing.md",
      title: "routing.md",
      summary: "Reference material for laravel-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "testing",
      source: new URL("./references/testing.md", import.meta.url),
      target: "references/testing.md",
      title: "testing.md",
      summary: "Reference material for laravel-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for laravel-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
