import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goTroubleshootingSkill = defineSkill({
  id: "go-troubleshooting",
  description: "当 Go 程序出现异常行为需要排查：CPU 飙高、内存泄漏、goroutine 泄漏、死锁、竞态、panic 或性能回归时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "diagnostic-tools",
      source: new URL("./references/diagnostic-tools.md", import.meta.url),
      target: "references/diagnostic-tools.md",
      title: "diagnostic-tools.md",
      summary: "Reference material for go-troubleshooting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "methodology",
      source: new URL("./references/methodology.md", import.meta.url),
      target: "references/methodology.md",
      title: "methodology.md",
      summary: "Reference material for go-troubleshooting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-troubleshooting.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
