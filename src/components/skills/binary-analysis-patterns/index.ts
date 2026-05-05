import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const binaryAnalysisPatternsSkill = defineSkill({
  id: "binary-analysis-patterns",
  description: "当需要对可执行文件、库或固件组件做静态反汇编、反编译、符号恢复、结构恢复和反逆向技术分析时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-reversing-techniques",
      source: new URL("./references/anti-reversing-techniques.md", import.meta.url),
      target: "references/anti-reversing-techniques.md",
      title: "anti-reversing-techniques.md",
      summary: "Reference material for binary-analysis-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "struct-recovery",
      source: new URL("./references/struct-recovery.md", import.meta.url),
      target: "references/struct-recovery.md",
      title: "struct-recovery.md",
      summary: "Reference material for binary-analysis-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "symbol-recovery",
      source: new URL("./references/symbol-recovery.md", import.meta.url),
      target: "references/symbol-recovery.md",
      title: "symbol-recovery.md",
      summary: "Reference material for binary-analysis-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for binary-analysis-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
