import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { appleRemindersSkill } from "../apple-reminders/index";

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
  antiPatterns: [
    defineAntiPattern({
      fail: "假设 CLI 参数",
      pass: "先看 --help",
    }),
    defineAntiPattern({
      fail: "Linux/CI 直接跑",
      pass: "平台前置检查",
    }),
    defineAntiPattern({
      fail: "不确认文件夹删除",
      pass: "显式 --folder",
    }),
  ],
  relatedSkills: [
    {
      get id() {
        return appleRemindersSkill.id;
      },
      reason: "用户要创建系统提醒、完成待办或管理提醒列表时联动；Notes 更适合长期记录。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "在 macOS 上通过 `memo notes` 查看、搜索、编辑、移动、删除或导出 Apple Notes 备忘录。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认运行环境是 macOS，并检查 `memo --help` 与 `memo notes --help` 是否可用。",
      "确认目标文件夹、搜索关键词、要查看的 note 编号或导出需求；交互式修改前先让用户确认范围。",
      "查看和搜索先用只读命令；新增、编辑、删除、移动这类操作需要明确 `--folder` 或交互选择。",
      "含图片或附件的笔记不适合直接编辑，导出时说明 HTML / Markdown 格式差异和默认导出位置。",
      "命令细节读取 `command-reference` reference；如果需求实际是系统提醒，转用 `apple-reminders`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "实际执行或建议执行的 `memo notes` 命令及其目的。",
      "目标文件夹、搜索条件、笔记编号或导出路径。",
      "对新增、编辑、删除、移动等交互式操作的确认点和风险说明。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "command-reference",
      source: new URL("./references/command-reference.md", import.meta.url),
      target: "references/command-reference.md",
      title: "Apple Notes CLI 命令速查",
      summary: "`memo notes` 查看、搜索、新增、编辑、移动、删除、文件夹和导出命令。",
      loadWhen: "需要实际操作 Apple Notes 或查看 memo notes 参数示例时读取。",
    }),
  ],
});
