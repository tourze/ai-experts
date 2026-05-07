import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const specDrivenDeliverySkill = defineSkill({
  id: "spec-driven-delivery",
  fullName: "需求驱动的可验证交付（SPARV）",
  description: "当需要把需求、计划、实现、审查和沉淀串成可验证交付流程，避免过早实现或跑偏时使用。",
  useCases: [
    "不是\"改一行\"的改动，需要把需求→实现→验证串起来一次走完。",
    "跨多次工具调用、可能跨 session，担心中途遗忘决策或跳过验证。",
    "小改动走 Quick 模式（Specify→Act→Review），仍走五阶段心智模型。",
  ],
  constraints: [
    "铁律：Spec 不达标不计划，计划没落实不执行，执行没验证不收尾。",
    "Spec 五维评分 Value、Scope、Acceptance、Boundaries、Risk 总分必须 ≥9 才进入 Plan。",
    "没有可验证验收标准不进入 Act；没有新鲜证据不进入 Vault。",
    "同任务连续 3 次失败必须停下问用户，不无限重试。",
    "高风险任务进入 Act 前必须拿用户显式 yes，并写进 journal。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "Specify：按 Value、Scope、Acceptance、Boundaries、Risk 各 0/1/2 评分；低于 9 分先澄清，不进入 Plan。",
      "Plan：拆 2-5 分钟粒度原子任务，每条带验证命令和依赖顺序，写入 `.sparv/journal.md`。",
      "Quick 模式仅在 spec ≥9、影响文件 ≤3、无高风险时跳过详细 Plan；Review 不能跳。",
      "Act：按 Plan 执行，每个任务结束立刻跑对应验证；每 2 次工具调用追加 journal 进度。",
      "失败处理：1 次调整重试，2 次换角度补上下文，3 次停下问用户。",
      "Review：对照完成承诺和 Plan 逐条核对，有新鲜证据后才收尾；顺手改动要么回退要么写进 journal。",
      "Vault：把 Patterns、Decisions、Gotchas 写入 `.sparv/kb.md`；跨 session 状态由 `.sparv/state.yaml`、`journal.md`、`kb.md` 承载。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "SPARV 状态：current_phase、completion_promise、action_count、consecutive_failures 和高风险确认。",
      "Journal：Plan、Progress、Findings、验证命令、失败处理和顺手改动说明。",
      "Review/Vault：验收证据、未覆盖项、可复用 Patterns、Decisions、Gotchas 和下一步。",
    ],
  }),
  references: [
    defineReference({
      id: "checklists",
      source: new URL("./references/checklists.md", import.meta.url),
      target: "references/checklists.md",
      title: "checklists.md",
      summary: "需求驱动交付各阶段的检查清单，覆盖需求澄清、计划、实现和验证。",
      loadWhen: "需要确保交付流程中不遗漏关键步骤或验证环节时读取。",
    }),
    defineReference({
      id: "journal-format",
      source: new URL("./references/journal-format.md", import.meta.url),
      target: "references/journal-format.md",
      title: "journal-format.md",
      summary: "交付过程日志的标准化格式模板，包含决策记录和变更追踪。",
      loadWhen: "需要记录交付过程或跨 session 追踪决策历史时读取。",
    }),
    defineReference({
      id: "scoring-rubric",
      source: new URL("./references/scoring-rubric.md", import.meta.url),
      target: "references/scoring-rubric.md",
      title: "scoring-rubric.md",
      summary: "交付成果的评分量规和验收标准参考。",
      loadWhen: "需要评估交付完成度或进行验收评审时读取。",
    }),
  ],
});
