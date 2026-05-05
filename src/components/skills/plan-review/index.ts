import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
