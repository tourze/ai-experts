import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const symfonyBundleArchitectureSkill = defineSkill({
  id: "symfony-bundle-architecture",
  fullName: "Symfony Bundle Architecture",
  description: "当用户要设计或审查 Symfony Bundle 的目录结构、DI Extension、CompilerPass 或 Bundle 间依赖时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for symfony-bundle-architecture.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
