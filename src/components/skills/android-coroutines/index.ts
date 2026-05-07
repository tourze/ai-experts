import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "`lifecycleScope.launch` 裸 collect。",
      pass: "使用 `repeatOnLifecycle(STARTED)` 安全收集。",
    }),
    defineAntiPattern({
      fail: "`catch (e: Exception)` 吞掉取消异常。",
      pass: "先 catch `CancellationException` 并重抛。",
    }),
    defineAntiPattern({
      fail: "`GlobalScope.launch` 破坏结构化并发。",
      pass: "使用 `viewModelScope` 或注入 `applicationScope`。",
    }),
    defineAntiPattern({
      fail: "硬编码 `Dispatchers.IO`。",
      pass: "通过构造函数注入 `CoroutineDispatcher`。",
    }),
    defineAntiPattern({
      fail: "暴露 `MutableStateFlow` 外部可变。",
      pass: "使用 `.asStateFlow()` 暴露只读视图。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认协程运行位置：ViewModel、Repository、DataSource、Worker、Application scope 或 UI 生命周期。",
      "检查 dispatcher 注入、main-safe suspend 函数和测试 dispatcher，避免硬编码线程池导致不可测。",
      "检查 Flow 收集是否绑定生命周期，Fragment / Activity 使用 `repeatOnLifecycle(STARTED)`。",
      "检查结构化并发：避免 `GlobalScope`，长任务要有明确 owner、取消传播和错误上报路径。",
      "检查紧密循环、callbackFlow、Channel 和异常处理；代码模式读取 `advanced-patterns` reference。",
      "修复后用 `runTest`、`advanceUntilIdle` 和泄漏 / 生命周期路径复测。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "协程 owner、scope、dispatcher、Flow 收集点和取消路径审计结果。",
      "main-safe、生命周期安全、异常处理和测试可控性的修复建议。",
      "需要迁移到 Flow、callbackFlow、Channel 或 applicationScope 的位置。",
      "对应单元测试、生命周期复测和剩余风险。",
    ],
  }),
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Android Coroutines 高级模式：自定义 Flow、Channel、协程异常处理与生命周期集成。",
      loadWhen: "需要实现复杂协程编排或排查协程内存泄漏时读取。",
    }),
  ],
});
