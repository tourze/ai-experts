import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
    "测试对象本身暴露服务层职责混乱，需要先拆清层级边界。",
  ],
  constraints: [
    "单元测试优先：能不用 Spring 容器就不用，避免用 `@SpringBootTest` 包住纯业务类。",
    "参数化测试不要只拿它批量堆样例，每个参数组合的意义要可从命名理解。",
    "Mockito 只隔离协作者，不要把每一层都 mock 到测试失真。",
  ],
  checklist: [
    "是否正确使用 `assertThrows`、`assertAll`、Mockito 验证与测试数据工厂。",
    "如果使用 Spring 测试切片，范围是否足够小，启动成本是否合理。",
  ],
  relatedSkills: [
    {
      get id() {
        return springBootLayeringSkill.id;
      },
      reason: "测试对象本身暴露服务层职责混乱，需要先拆清 Spring 分层边界时联动。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "需要通用测试原则、AAA/FIRST、fixture、mock、参数化测试或测试反模式时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "@SpringBootTest 测纯逻辑",
      pass: "纯业务类直接 `new`，不启动容器。",
    }),
    defineAntiPattern({
      fail: "Thread.sleep 等异步",
      pass: "用 Awaitility 显式等待替代固定睡眠。",
    }),
    defineAntiPattern({
      fail: "只验证 mock 调用",
      pass: "用 `ArgumentCaptor` 验证传入内容，不要只 `verify(repo).save(any())`。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先判断测试层级：纯业务类直接 new，Web/Data/Spring 切片测试限定范围，只有端到端集成才用 `@SpringBootTest`。",
      "按行为命名测试，使用 AAA 结构组织 arrange/act/assert，必要时从 `testing-patterns` 获取通用测试原则。",
      "重复输入用参数化测试，但每组数据必须表达不同业务含义，不堆无解释样例。",
      "Mockito 只隔离协作者；验证结果和关键参数内容，必要时用 `ArgumentCaptor`，不要只验证 `any()` 调用。",
      "复杂断言、异步等待和反模式示例读取 advanced-patterns；异步场景优先 Awaitility，不用固定 sleep。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试层级选择、被测行为、fixture/Mock 边界和需要启动 Spring 容器的理由。",
      "JUnit 5 测试代码：参数化输入、异常断言、assertAll 分组或 Mockito 隔离。",
      "测试反模式审查结果、运行命令、失败路径覆盖和与 spring-boot-layering/testing-patterns 的联动点。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "JUnit 5 高级测试模式：参数化测试、嵌套测试、扩展模型与断言模式。",
      loadWhen: "需要编写参数化测试、自定义扩展或复杂 JUnit 5 场景时读取。",
    }),
  ],
});
