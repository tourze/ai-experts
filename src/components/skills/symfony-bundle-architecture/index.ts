import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { doctrineEntityPatternsSkill } from "../doctrine-entity-patterns/index";

export const symfonyBundleArchitectureSkill = defineSkill({
  id: "symfony-bundle-architecture",
  fullName: "Symfony Bundle Architecture",
  description: "当用户要设计或审查 Symfony Bundle 的目录结构、DI Extension、CompilerPass 或 Bundle 间依赖时使用。",
  useCases: [
    "新建或审查 Bundle 的 Extension、services.yaml、CompilerPass 和依赖声明。",
    "Bundle 间依赖混乱、可选依赖缺失、Monorepo 多 Bundle 协作。",
    "Entity 设计联动 `doctrine-entity-patterns`；代码示例和调试命令读取 `bundle-reference`。",
  ],
  constraints: [
    "Bundle 类只做：声明依赖 + 注册 CompilerPass。",
    "Extension `load()` 只加载配置文件，不直接构造服务。",
    "services.yaml 用 `autowire` + `autoconfigure` + 按命名空间 `resource` 扫描；禁用 `exclude`。",
    "CompilerPass 仅用于标签和配置无法完成的操作，必须 `hasDefinition()` 前置检查。",
    "Bundle 间依赖必须显式声明，不靠加载顺序。",
  ],
  checklist: [
    "Bundle 类是否只含 `build()` 和依赖声明。",
    "Extension 是否通过 FileLocator + Loader 加载配置。",
    "services.yaml 是否按命名空间分组 `resource`。",
    "CompilerPass 是否做了存在性前置检查。",
    "Bundle 间依赖是否显式声明，可选依赖是否有降级。",
  ],
  relatedSkills: [
    {
      get id() {
        return doctrineEntityPatternsSkill.id;
      },
      reason: "Bundle 内包含 Doctrine Entity、Repository 或 Migration 设计时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Extension 里做运行时调用",
      pass: "Extension 只加载配置",
    }),
    defineAntiPattern({
      fail: "所有服务 public: true",
      pass: "默认 private",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "读取 Bundle 类、Extension、配置文件、CompilerPass、服务定义和 Bundle 间依赖；完整示例按需读取 `bundle-reference`。",
      "检查 Bundle 类是否只做依赖声明和 CompilerPass 注册，不承载运行时逻辑。",
      "检查 Extension 是否只加载配置，不直接构造服务或访问运行时状态。",
      "检查 services.yaml 是否按命名空间 resource 扫描、默认 private、避免无意义 public 服务。",
      "检查 CompilerPass 是否只处理标签或配置无法覆盖的操作，并在 `hasDefinition()` 后再改定义。",
      "检查显式依赖、可选依赖降级和多 Bundle monorepo 协作边界。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Bundle 边界与依赖审查结果。",
      "Extension、services.yaml、CompilerPass 的最小修复建议。",
      "可选依赖和降级策略。",
      "需要参考的 `bundle-reference` 示例。",
    ],
  }),
  references: [
    defineReference({
      id: "bundle-reference",
      source: new URL("./references/bundle-reference.md", import.meta.url),
      target: "references/bundle-reference.md",
      title: "Symfony Bundle 实现参考",
      summary: "Bundle 类、Extension、CompilerPass、services.yaml、依赖声明和调试命令示例。",
      loadWhen: "需要完整 Symfony Bundle 结构、DI 或 CompilerPass 示例时读取。",
    }),
  ],
});
