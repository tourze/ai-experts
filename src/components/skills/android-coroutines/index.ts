import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidCoroutinesSkill = defineSkill({
  id: "android-coroutines",
  fullName: "Android Coroutines",
  description: "当用户要在 Android 上使用 Kotlin Coroutines、结构化并发、Flow、生命周期集成或协程异常处理时使用。",
  useCases: [
    "实现 API/数据库的异步调用、后台任务处理。",
    "修复线程/任务相关的内存泄漏。",
    "将回调/Listener 转换为 Coroutines。",
    "实现 ViewModel 的 UI 状态管理。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for android-coroutines.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
