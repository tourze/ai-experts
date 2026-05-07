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
import { appleNotesSkill } from "../apple-notes/index";

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
  relatedSkills: [
    {
      get id() {
        return appleNotesSkill.id;
      },
      reason: "用户要保存长期记录、资料或富文本内容时联动；Reminders 更适合到期提醒和待办。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "在 macOS 上通过 `remindctl` 查看、创建、完成、删除和管理 Apple Reminders 提醒事项。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认运行环境是 macOS，执行 `remindctl status`，未授权时引导 `remindctl authorize`。",
      "判断需求类型：查看提醒、管理列表、新增提醒、完成提醒或删除提醒。",
      "查看类需求优先使用 `show` 过滤器和 `--json` / `--plain`；日期和列表名需要明确。",
      "新增提醒前确认标题、列表、到期时间和是否需要同步到系统提醒。",
      "完成、删除和列表变更属于破坏性动作，先 `show` 核对 ID 或列表名，再执行操作。",
      "命令细节读取 `command-reference` reference；如果需求是长期记录或资料整理，转用 `apple-notes`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "实际执行或建议执行的 `remindctl` 命令及其目的。",
      "目标列表、提醒 ID、日期过滤器、输出格式和授权状态。",
      "新增 / 完成 / 删除 / 列表变更前的确认项和执行结果。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "command-reference",
      source: new URL("./references/command-reference.md", import.meta.url),
      target: "references/command-reference.md",
      title: "Apple Reminders CLI 命令速查",
      summary: "`remindctl` 查看提醒、管理列表、新增、完成和删除提醒的命令示例。",
      loadWhen: "需要实际操作 Apple Reminders 或查看 remindctl 参数示例时读取。",
    }),
  ],
});
