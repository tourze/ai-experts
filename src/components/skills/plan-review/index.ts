import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const planReviewSkill = defineSkill({
  id: "plan-review",
  fullName: "plan-review",
  description: "在编码前审查实现计划、方案文档或 RFC 时使用；重点核 scope、假设、风险、依赖、回归面和缺口。",
  useCases: [
    "适合评审方案是否可落地、是否漏边界、是否高估团队能力或低估依赖。",
    "适合在投入编码前做一轮“会在哪翻车”的压力测试。",
    "交叉引用：需要任务化输出时配合 `task-decomposer`；还没做系统设计时先用 `system-design`。",
  ],
  constraints: [
    "评审对象必须是计划或方案，不要在没有计划时假装评审。",
    "要把假设、依赖、风险、回滚和验证路径分开写。",
    "优先指出真正会导致失败的缺口，而不是泛泛建议“多测试”。",
    "不替方案作者做实现细节脑补；缺失信息就明确标成缺口。",
  ],
  checklist: [
    "是否明确了目标、范围边界和不做什么。",
    "是否列出了外部依赖、先决条件和阻塞项。",
    "是否覆盖了回滚、迁移、灰度和验证方式。",
    "是否把风险按严重度和发生概率排过序。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "没计划就评审",
      pass: "先要计划",
    }),
    defineAntiPattern({
      fail: "只挑表达",
      pass: "落到执行风险",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "project-detection",
      source: new URL("./references/project-detection.md", import.meta.url),
      target: "references/project-detection.md",
      title: "project-detection.md",
      summary: "Reference material for plan-review.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
