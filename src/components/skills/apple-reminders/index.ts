import {
  InvocationPolicy,
  KnownTool,
  Platform,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
