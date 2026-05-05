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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
