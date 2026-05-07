import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const androidTestingSkill = defineSkill({
  id: "android-testing",
  fullName: "Android 测试策略",
  description: "当用户要为 Android 写单元测试、Hilt 集成测试、Roborazzi 截图测试或 Compose 测试时使用。",
  useCases: [
    "为 ViewModel / Repository / UseCase 编写单元测试",
    "配置 Hilt 集成测试环境",
    "搭建 Roborazzi 截图回归测试",
    "编写 Compose UI 测试",
  ],
  constraints: [
    "测试金字塔以 ViewModel、Repository、UseCase 单元测试为主，UI / 截图测试只覆盖关键页面和高风险交互。",
    "ViewModel 和协程测试必须注入 `TestDispatcher`，用 `runTest`、`advanceUntilIdle` 确定性推进。",
    "Repository 测试必须覆盖正常路径、错误路径和缓存 / fallback 行为。",
    "Hilt 集成测试用 `@TestInstallIn` 替换真实依赖，不连真实网络或生产数据库。",
    "Compose UI 测试通过文本、语义或 testTag 定位节点，不使用坐标。",
    "Roborazzi 基准录制和验证命令必须接入 CI，截图差异要可复核。",
  ],
  checklist: [
    "ViewModel 测试注入 `TestDispatcher`，不依赖真实线程",
    "Repository 测试覆盖正常路径和异常回退路径",
    "Hilt 测试用 `@TestInstallIn` 替换真实依赖",
    "关键页面有 Roborazzi 截图测试",
    "CI 配置 `verifyRoborazziDebug` 任务",
    "Compose 测试通过语义（文本、testTag）查找节点，不用坐标",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Compose 测试用坐标",
      pass: "按语义查找",
    }),
    defineAntiPattern({
      fail: "ViewModel 测试用 delay 等待",
      pass: "advanceUntilIdle 确定性推进",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先识别待测对象：ViewModel、Repository、UseCase、Room DAO、网络层、Compose UI 或截图回归。",
      "按测试金字塔分配覆盖：逻辑层优先单元测试，组件交互用集成测试，关键页面用 UI / 截图测试。",
      "配置依赖时读取 `dependencies`，确认 JUnit、coroutines-test、AndroidX Test、Compose、Hilt 和 Roborazzi 版本。",
      "编写协程测试时注入 TestDispatcher，避免真实 delay、真实线程和非确定性等待。",
      "编写 Hilt、Roborazzi 和 Compose 测试时读取 `code-patterns`，按语义节点和可复核截图路径实现。",
      "输出 CI 命令、基准截图策略和失败定位方法，确保测试能在本地与 CI 重现。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "测试范围分层、优先级和每层建议用例。",
      "依赖配置、Hilt 替换、TestDispatcher 和 Roborazzi / Compose 测试接线。",
      "示例测试代码位置、运行命令和 CI 验证任务。",
      "剩余未覆盖风险、flaky 风险和需要人工验证的路径。",
    ],
  }),
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "Android 测试代码模式",
      summary: "测试金字塔、ViewModel / Repository / Hilt / Roborazzi / Compose UI 测试示例和运行命令。",
      loadWhen: "需要编写 Android 测试代码或配置截图 / UI 测试命令时读取。",
    }),
    defineReference({
      id: "dependencies",
      source: new URL("./references/dependencies.md", import.meta.url),
      target: "references/dependencies.md",
      title: "dependencies.md",
      summary: "Android 测试框架依赖配置：JUnit、Hilt、Roborazzi 与 Compose 测试库版本。",
      loadWhen: "需要配置 Android 测试依赖或添加新测试框架时读取。",
    }),
  ],
});
