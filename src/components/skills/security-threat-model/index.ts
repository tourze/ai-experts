import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const securityThreatModelSkill = defineSkill({
  id: "security-threat-model",
  description: "当用户要求对代码仓库做 STRIDE 分析、攻击树构建、威胁缓解映射或安全需求提取的 AppSec 威胁建模时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "attack-tree-construction",
      source: new URL("./references/attack-tree-construction.md", import.meta.url),
      target: "references/attack-tree-construction.md",
      title: "attack-tree-construction.md",
      summary: "Reference material for security-threat-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "prompt-template",
      source: new URL("./references/prompt-template.md", import.meta.url),
      target: "references/prompt-template.md",
      title: "prompt-template.md",
      summary: "Reference material for security-threat-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "security-controls-and-assets",
      source: new URL("./references/security-controls-and-assets.md", import.meta.url),
      target: "references/security-controls-and-assets.md",
      title: "security-controls-and-assets.md",
      summary: "Reference material for security-threat-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "security-requirement-extraction",
      source: new URL("./references/security-requirement-extraction.md", import.meta.url),
      target: "references/security-requirement-extraction.md",
      title: "security-requirement-extraction.md",
      summary: "Reference material for security-threat-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "stride-analysis-patterns",
      source: new URL("./references/stride-analysis-patterns.md", import.meta.url),
      target: "references/stride-analysis-patterns.md",
      title: "stride-analysis-patterns.md",
      summary: "Reference material for security-threat-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "threat-mitigation-mapping",
      source: new URL("./references/threat-mitigation-mapping.md", import.meta.url),
      target: "references/threat-mitigation-mapping.md",
      title: "threat-mitigation-mapping.md",
      summary: "Reference material for security-threat-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for security-threat-model.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
