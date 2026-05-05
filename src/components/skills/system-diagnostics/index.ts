import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const systemDiagnosticsSkill = defineSkill({
  id: "system-diagnostics",
  description: "当用户说 Linux 主机变慢、服务异常、需要健康检查或要先摸清系统现状时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "disk-cleanup",
      source: new URL("./references/disk-cleanup.md", import.meta.url),
      target: "references/disk-cleanup.md",
      title: "disk-cleanup.md",
      summary: "Reference material for system-diagnostics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "performance-optimizer",
      source: new URL("./references/performance-optimizer.md", import.meta.url),
      target: "references/performance-optimizer.md",
      title: "performance-optimizer.md",
      summary: "Reference material for system-diagnostics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for system-diagnostics.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
