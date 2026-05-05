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
  constraints: [
    "**Dispatcher 注入**：禁止硬编码 `Dispatchers.IO`，必须通过构造函数注入 `CoroutineDispatcher`。",
    "**Main-Safety**：Data/Domain 层的所有 `suspend` 函数必须 main-safe。",
    "**生命周期安全收集**：必须使用 `repeatOnLifecycle(Lifecycle.State.STARTED)`。",
    "**禁用 GlobalScope**：破坏结构化并发，导致泄漏。",
    "**协作式取消**：紧密循环中必须调用 `ensureActive()` 或 `yield()`。",
    "**异常处理**：禁止在通用 `catch (e: Exception)` 中吞掉 `CancellationException`。",
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
