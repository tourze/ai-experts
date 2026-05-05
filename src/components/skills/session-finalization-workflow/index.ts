import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const sessionFinalizationWorkflowSkill = defineSkill({
  id: "session-finalization-workflow",
  fullName: "会话终结工作流",
  description: "当代码实现完成、需要从完成状态推到可交付状态时使用；提供验证、分支收尾、提交、记录（原 record-session）、复盘的完整流程 checklist。任务闭合后也用于深度复盘，沉淀长期资产。",
  useCases: [
    "当代码实现完成、需要从完成状态推到可交付状态时使用；提供验证、分支收尾、提交、记录（原 record-session）、复盘的完整流程 checklist。任务闭合后也用于深度复盘，沉淀长期资产。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "session-record",
      source: new URL("./references/session-record.md", import.meta.url),
      target: "references/session-record.md",
      title: "session-record.md",
      summary: "Reference material for session-finalization-workflow.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
