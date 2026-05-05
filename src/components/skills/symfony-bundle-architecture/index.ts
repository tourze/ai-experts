import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const symfonyBundleArchitectureSkill = defineSkill({
  id: "symfony-bundle-architecture",
  fullName: "Symfony Bundle Architecture",
  description: "当用户要设计或审查 Symfony Bundle 的目录结构、DI Extension、CompilerPass 或 Bundle 间依赖时使用。",
  useCases: [
    "新建或审查 Bundle 的 Extension、services.yaml、CompilerPass 和依赖声明。",
    "Bundle 间依赖混乱、可选依赖缺失、Monorepo 多 Bundle 协作。",
    "Entity 设计联动 [doctrine-entity-patterns](../doctrine-entity-patterns/SKILL.md)；代码示例和调试命令见 [reference.md](reference.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
