import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
    "[ ] 已说明每个测试项对应的测试层级",
    "[ ] 已覆盖主路径、失败路径、边界条件",
    "[ ] 已识别哪些地方不值得自动化",
    "[ ] 若存在现有测试，已指出新增与复用边界",
    "[ ] 输出可以直接转成任务列表",
    "[ ] 关键业务路径已识别",
    "[ ] 风险矩阵含业务影响与技术风险两个维度",
    "[ ] 质量门是可测量的",
    "[ ] 自动化投入与风险等级匹配",
    "[ ] 已写清楚哪些地方接受人工验证或降级策略",
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
      summary: "Reference material for testing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "testing-discipline",
      source: new URL("./references/testing-discipline.md", import.meta.url),
      target: "references/testing-discipline.md",
      title: "testing-discipline.md",
      summary: "Reference material for testing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "verification-loop",
      source: new URL("./references/verification-loop.md", import.meta.url),
      target: "references/verification-loop.md",
      title: "verification-loop.md",
      summary: "Reference material for testing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
