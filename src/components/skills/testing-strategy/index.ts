import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { preLandingReviewSkill } from "../pre-landing-review/index";
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
      reason: "需要和 `pre-landing-review` 联动，把阻断项映射到补测策略。",
    },
    {
      get id() {
        return webappTestingSkill.id;
      },
      reason: "为 `webapp-testing` 提供执行列表。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不分层级的测试建议：getter/setter 和第三方框架行为也要测？成本失控。",
      pass: "按风险分层：不区分单测、集成、E2E，导致成本失控。 把框架行为和样板代码当成重点测试对象。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
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
