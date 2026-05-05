import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const promptEngineeringPatternsSkill = defineSkill({
  id: "prompt-engineering-patterns",
  description: "当用户要设计、优化、约束或排查生产 prompt、few-shot 示例、系统 prompt、结构化响应契约或 prompt 变体实验时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "optimize-prompt",
      entry: new URL("./scripts/optimize-prompt.mjs", import.meta.url),
      target: "scripts/optimize-prompt.mjs",
      runtime: "node",
      bundle: false,
      description: "Script optimize-prompt.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "chain-of-thought",
      source: new URL("./references/chain-of-thought.md", import.meta.url),
      target: "references/chain-of-thought.md",
      title: "chain-of-thought.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evaluation-metrics",
      source: new URL("./references/evaluation-metrics.md", import.meta.url),
      target: "references/evaluation-metrics.md",
      title: "evaluation-metrics.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "failure-modes",
      source: new URL("./references/failure-modes.md", import.meta.url),
      target: "references/failure-modes.md",
      title: "failure-modes.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "few-shot-learning",
      source: new URL("./references/few-shot-learning.md", import.meta.url),
      target: "references/few-shot-learning.md",
      title: "few-shot-learning.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "output-constraints",
      source: new URL("./references/output-constraints.md", import.meta.url),
      target: "references/output-constraints.md",
      title: "output-constraints.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "prompt-optimization",
      source: new URL("./references/prompt-optimization.md", import.meta.url),
      target: "references/prompt-optimization.md",
      title: "prompt-optimization.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "prompt-patterns",
      source: new URL("./references/prompt-patterns.md", import.meta.url),
      target: "references/prompt-patterns.md",
      title: "prompt-patterns.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "prompt-templates",
      source: new URL("./references/prompt-templates.md", import.meta.url),
      target: "references/prompt-templates.md",
      title: "prompt-templates.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "system-prompts",
      source: new URL("./references/system-prompts.md", import.meta.url),
      target: "references/system-prompts.md",
      title: "system-prompts.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for prompt-engineering-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
  assets: [
    defineAsset({
      id: "few-shot-examples",
      source: new URL("./assets/few-shot-examples.json", import.meta.url),
      target: "assets/few-shot-examples.json",
    }),
    defineAsset({
      id: "prompt-template-library",
      source: new URL("./assets/prompt-template-library.md", import.meta.url),
      target: "assets/prompt-template-library.md",
    })
  ],
});
