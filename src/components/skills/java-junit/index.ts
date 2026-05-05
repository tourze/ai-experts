import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const javaJunitSkill = defineSkill({
  id: "java-junit",
  fullName: "Java JUnit",
  description: "当需要编写或审查 JUnit 5 测试、参数化测试或 Mockito 隔离时使用。",
  useCases: [
    "为 Java / Spring 代码补 JUnit 5 单元测试或重构现有测试。",
    "需要参数化测试、异常断言、Mockito 隔离与测试命名规范。",
    "想区分单元测试、切片测试和 `@SpringBootTest` 的使用边界。",
    "如果测试对象本身来自服务层设计问题，可回看 [spring-boot-layering](../spring-boot-layering/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for java-junit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
