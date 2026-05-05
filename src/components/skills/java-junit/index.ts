import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { springBootLayeringSkill } from "../spring-boot-layering/index";
import { testingPatternsSkill } from "../testing-patterns/index";

export const javaJunitSkill = defineSkill({
  id: "java-junit",
  fullName: "Java JUnit",
  description: "当需要编写或审查 JUnit 5 测试、参数化测试或 Mockito 隔离时使用。",
  useCases: [
    "为 Java / Spring 代码补 JUnit 5 单元测试或重构现有测试。",
    "需要参数化测试、异常断言、Mockito 隔离与测试命名规范。",
    "想区分单元测试、切片测试和 `@SpringBootTest` 的使用边界。",
    "如果测试对象本身来自服务层设计问题，可回看 `spring-boot-layering`。",
  ],
  constraints: [
    "单元测试优先：能不用 Spring 容器就不用，避免用 `@SpringBootTest` 包住纯业务类。",
    "参数化测试不要只拿它批量堆样例，每个参数组合的意义要可从命名理解。",
    "Mockito 只隔离协作者，不要把每一层都 mock 到测试失真。",
  ],
  relatedSkills: [
    {
      get id() {
        return springBootLayeringSkill.id;
      },
      reason: "如果测试对象本身来自服务层设计问题，可回看 `spring-boot-layering`。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 `testing-patterns`。本 skill 只覆盖 Java 特有语法与工具。",
    },
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
