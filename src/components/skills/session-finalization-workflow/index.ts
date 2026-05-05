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
    "功能实现、Bug 修复、重构完成后的收尾交付。",
    "工作日结束前的会话清理。",
    "任务闭合后需深度复盘沉淀长期规则。",
  ],
  constraints: [
    "任务仍在推进且非阶段性 handoff 时不使用。",
    "短会话（< 3 轮有效编码交互）只给简短收尾。",
    "作为 subagent 被派遣（看到 <SUBAGENT-STOP> 即跳过）。",
    "禁止伪完成：验证命令没跑就说\"通过\"、改动没看就说\"没问题\"。",
    "禁止混合提交：不相关的改动必须分开 commit。",
    "禁止跳过审查：`git diff --cached` 必须过一遍。",
    "禁止 force push 到主分支。",
    "禁止伪造治理建议：不读现有 MEMORY 就建议新增。",
    "本 skill 默认不主动改 MEMORY.md / hooks / skill 文件；治理建议经用户确认后再落盘。",
    "执行时遵循正文中的流程和必要参考资料，不用未经验证的假设替代证据。",
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
      summary: "会话复盘与记录模板，包含决策记录、遗留事项和长期资产沉淀方法。",
      loadWhen: "需要记录会话复盘内容或沉淀长期可复用资产时读取。",
    }),
  ],
});
