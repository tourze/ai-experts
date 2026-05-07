import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { preLandingReviewSkill } from "../pre-landing-review/index";
import { testingPatternsSkill } from "../testing-patterns/index";
import { webappTestingSkill } from "../webapp-testing/index";

export const testingStrategySkill = defineSkill({
  id: "testing-strategy",
  fullName: "测试策略与计划设计",
  description: "当需要为模块、接口或功能设计测试计划，或制定风险驱动测试策略、质量门、coverage target 与 QA 资源分配时使用。",
  useCases: [
    "用户想知道模块、功能或接口如何分层测试（测什么、用什么层级、优先测哪些）。",
    "为 `webapp-testing` 提供执行列表。",
    "缺陷后测试扩面（同根因 bug 家族补测），参考 [test-brainstorm](./references/test-brainstorm.md)。",
    "自动化验证循环（实现→验证→修复→再验证），参考 [verification-loop](./references/verification-loop.md)。",
    "需要为中大型项目制定风险驱动测试策略、质量门、覆盖率目标或 QA 资源分配方案。",
    "需要和 `pre-landing-review` 联动，把阻断项映射到补测策略。",
  ],
  constraints: [
    "每个测试项都要回答两个问题：\n- 为什么测\n- 用什么层级测",
    "优先覆盖业务关键路径、失败路径、边界条件和安全边界。",
    "单测、集成、E2E 要按成本与信心权衡，不搞“全用 E2E”。",
    "如果已有测试，先指出覆盖缺口再补新项。",
    "覆盖率不是目标本身，必须与风险分布一起解释。",
    "每个质量门都要可测量，不能写成空话。",
    "通用测试纪律见 [references/testing-discipline.md](references/testing-discipline.md)。",
  ],
  checklist: [
    "已说明每个测试项对应的测试层级",
    "已覆盖主路径、失败路径、边界条件",
    "已识别哪些地方不值得自动化",
    "若存在现有测试，已指出新增与复用边界",
    "输出可以直接转成任务列表",
    "关键业务路径已识别",
    "风险矩阵含业务影响与技术风险两个维度",
    "质量门是可测量的",
    "自动化投入与风险等级匹配",
    "已写清楚哪些地方接受人工验证或降级策略",
  ],
  relatedSkills: [
    {
      get id() {
        return preLandingReviewSkill.id;
      },
      reason: "需要把落地前阻断项、风险确认或发布门禁映射成补测策略时联动。",
    },
    {
      get id() {
        return webappTestingSkill.id;
      },
      reason: "测试策略需要转成 Web 应用手工/自动化执行清单时联动。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "测试计划需要落到 AAA / FIRST、fixture、mock 或参数化测试结构时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不分层级的测试建议：getter/setter 和第三方框架行为也要测？成本失控。",
      pass: "按风险分层，说明每个测试项为什么测、用什么层级测。",
    }),
    defineAntiPattern({
      fail: "把框架行为和样板代码当成重点测试对象。",
      pass: "把测试投入留给业务关键路径、失败路径、边界条件和安全边界。",
    }),
    defineAntiPattern({
      fail: "一刀切覆盖率：支付链路和营销页获得同等投入，高风险模块被平均化覆盖。",
      pass: "风险驱动的差异化投入",
    }),
    defineAntiPattern({
      fail: "不可执行的质量门：无法在 CI 中自动判断通过/失败。",
      pass: "可测量的质量门",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先识别业务关键路径、失败路径、边界条件、安全边界、现有覆盖缺口和不值得自动化的区域。",
      "每个测试项都说明为什么测、用什么层级测，并按成本与信心权衡单测、集成、E2E 和人工验证。",
      "用风险矩阵决定测试深度和质量门，覆盖率必须结合风险分布解释。",
      "轻量测试计划、覆盖目标、风险矩阵和质量门示例读取 `test-plan-patterns`；缺陷扩面和验证循环读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试层级规划、关键场景、覆盖缺口和不自动化范围。",
      "风险矩阵、质量门、coverage target 和 QA / 自动化投入建议。",
      "可直接转成任务列表或 Web 测试执行清单的补测计划。",
    ],
  }),
  references: [
    defineReference({
      id: "test-plan-patterns",
      source: new URL("./references/test-plan-patterns.md", import.meta.url),
      target: "references/test-plan-patterns.md",
      title: "测试计划模式",
      summary: "轻量测试计划、覆盖目标、生产级风险矩阵和质量门示例。",
      loadWhen: "需要快速制定测试计划、风险矩阵或质量门时读取。",
    }),
    defineReference({
      id: "test-brainstorm",
      source: new URL("./references/test-brainstorm.md", import.meta.url),
      target: "references/test-brainstorm.md",
      title: "test-brainstorm.md",
      summary: "缺陷后测试扩面的头脑风暴方法，从同根因 bug 家族推导补测范围。",
      loadWhen: "需要从已发现的缺陷出发，推导同类问题扩散面和补测清单时读取。",
    }),
    defineReference({
      id: "testing-discipline",
      source: new URL("./references/testing-discipline.md", import.meta.url),
      target: "references/testing-discipline.md",
      title: "testing-discipline.md",
      summary: "通用测试纪律规范，包括命名、结构、断言风格和代码组织原则。",
      loadWhen: "需要制定或审查项目统一的测试编写纪律时读取。",
    }),
    defineReference({
      id: "verification-loop",
      source: new URL("./references/verification-loop.md", import.meta.url),
      target: "references/verification-loop.md",
      title: "verification-loop.md",
      summary: "自动化验证循环模式，实现→验证→修复→再验证的迭代流程。",
      loadWhen: "需要设计自动化验证流程或在 CI 中嵌入验证循环时读取。",
    }),
  ],
});
