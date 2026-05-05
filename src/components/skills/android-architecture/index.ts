import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const androidArchitectureSkill = defineSkill({
  id: "android-architecture",
  fullName: "Android 现代架构",
  description: "当用户要设计或重构 Android 架构、Clean Architecture、Hilt 注入或多模块时使用。",
  useCases: [
    "设计或重构 Android 应用架构",
    "搭建新项目的模块结构",
    "配置 Hilt 依赖注入",
    "评审代码的分层合理性",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  checklist: [
    "Domain 层无 `android.*` 导入",
    "Repository 的 `suspend` 函数 main-safe（内部 `withContext` 切线程）",
    "ViewModel 通过 `StateFlow` 向 UI 暴露状态",
    "`MutableStateFlow` / `MutableSharedFlow` 不对外暴露（通过 `.asStateFlow()` 转为只读）",
    "Hilt Module 中接口绑定用 `@Binds`，仅第三方实例用 `@Provides`",
    "Feature 模块不互相依赖，只依赖 `:core:*`",
    "依赖方向单向向内，无循环依赖",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Domain 层依赖 Android",
      pass: "Domain 层纯 Kotlin",
    }),
    defineAntiPattern({
      fail: "ViewModel 暴露可变状态",
      pass: "只读 StateFlow",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
