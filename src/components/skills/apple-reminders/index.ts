import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const appleRemindersSkill = defineSkill({
  id: "apple-reminders",
  fullName: "Apple Reminders CLI",
  description: "当用户要查看、创建、完成、删除或管理 Apple Reminders 提醒事项时使用。",
  useCases: [
    "用户要把待办写入 Apple Reminders，并同步到 iPhone / iPad / Mac。",
    "用户要查看今天、逾期、本周或指定日期的提醒事项。",
    "用户要管理提醒列表、完成任务或删除任务。",
  ],
  constraints: [
    "仅支持 macOS；首次使用要授权 Reminders 访问权限。",
    "查看命令的核心入口是 `remindctl show [filter]`，默认直接执行 `remindctl` 也会走查看逻辑。",
    "创建、完成、删除命令都有独立子命令：`add` / `complete` / `delete`。",
    "如果用户说“提醒我”，先确认他要的是 Apple Reminders 里的系统提醒，而不是对话内定时提醒。",
  ],
  checklist: [
    "先跑 `remindctl status`，未授权时执行 `remindctl authorize`。",
    "查看类需求优先用 `show` 过滤器：`today` / `tomorrow` / `week` / `overdue` / `all` / 指定日期。",
    "需要脚本化输出时使用 `--json` 或 `--plain`。",
    "删除和列表变更属于破坏性动作，执行前要确认目标 ID 或列表名。",
    "交叉引用：更适合做长期记录的内容改用 `apple-notes`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "误把过滤器当子命令",
      pass: "show 是入口",
    }),
    defineAntiPattern({
      fail: "跳过权限检查",
      pass: "自动 status + authorize",
    }),
    defineAntiPattern({
      fail: "不校验 ID 批量删",
      pass: "先 show 再删",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
