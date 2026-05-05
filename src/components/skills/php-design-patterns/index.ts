import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const phpDesignPatternsSkill = defineSkill({
  id: "php-design-patterns",
  fullName: "PHP 设计模式与分层",
  description: "当用户要拆分 PHP 类职责、设计服务层与 Repository、构建 DTO/值对象、规范依赖注入或让控制器保持薄化时使用。",
  useCases: [
    "新建 service、repository、DTO、值对象等核心组件时需要先定边界。",
    "现有类已经变成 God class，业务逻辑散落在控制器和模型里。",
    "需要把依赖注入从\"到处 `new`\"收敛为构造函数注入。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for php-design-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
