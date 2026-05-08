import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "Step 1 自检验证：审查 `git diff --cached`、运行相关验证命令、确认无新增 lint/类型/测试失败、无调试语句和敏感信息。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "Step 2 分支收尾：用 `git status --short` 查遗漏文件，排除无关 hunk，确认分支名与改动一致。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "Step 3 提交：Conventional Commits、跨关注点拆分、`git diff --cached --stat` 确认提交范围。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "Step 4 会话记录：基于 git log/diff/status 采集事实，按 session-record 模板记录完成工作、关键决策、遗留事项和变更文件。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "Step 5 复盘：识别效率瓶颈、方向调整、信息不足和可沉淀规则。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "Step 6 评审响应：逐条处理 PR review，先解决冲突再提交。",
      }),
      defineWorkflowStep({
        id: "step-7",
        label: "深度复盘只在任务闭合或出现长期规则信号时做，治理建议先去重、量化收益，并经用户确认后再落盘。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "会话终结报告：完成项、改动文件、验证结果、关键决策、未完成项与下次入口。",
      "治理资产建议：MEMORY ≤5、工作流 ≤2、Skill ≤3、Hooks ≤2，每条含 Why/How 或具体路径。",
      "不沉淀清单：短期状态、无长期价值观察、未验证治理建议和不落盘原因。",
    ],
  }),
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
