import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const appleNotesSkill = defineSkill({
  id: "apple-notes",
  fullName: "Apple Notes CLI",
  description: "当用户需要查看、搜索、编辑或导出 Apple Notes 备忘录时使用。",
  useCases: [
    "用户要在 macOS 里查看、搜索、编辑或导出 Apple Notes。",
    "用户需要在终端中快速浏览某个文件夹下的备忘录。",
    "用户希望把 Notes 内容导出为 HTML / Markdown。",
  ],
  constraints: [
    "仅支持 macOS，并且第一次使用通常需要授权 Notes 自动化权限。",
    "入口命令是 `memo notes`；新增、编辑、删除这类操作依赖交互式选择。",
    "`--add` / `--edit` / `--delete` 这类操作通常要配合 `--folder` 使用。",
    "含图片或附件的笔记不适合直接编辑；导出时要预期格式差异。",
  ],
  checklist: [
    "先确认 `memo` 已安装：`memo --help`、`memo notes --help`。",
    "操作前确认目标文件夹名称；交互命令默认会弹选择器。",
    "如果用户要批量自动化，先验证是否允许交互式操作。",
    "导出前提醒用户：导出目标默认在桌面。",
    "交叉引用：需要任务提醒时用 `apple-reminders`，不要把 Notes 当待办系统。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
