import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const androidRedexSkill = defineSkill({
  id: "android-redex",
  fullName: "ReDex — Android 字节码优化",
  description: "当用户要用 ReDex 优化 Android APK 体积/性能、配置 pass 或排查优化问题时使用。",
  useCases: [
    "当用户要用 ReDex 优化 Android APK 体积/性能、配置 pass 或排查优化问题时使用。",
  ],
  constraints: [
    "先确认 ReDex 安装方式、Android SDK 路径、输入 APK、签名材料和 ProGuard / mapping 文件是否齐全。",
    "从保守 pass 组合开始，逐步启用优化；遇到反射、JNI、序列化或依赖注入时优先保护 keep 规则。",
    "ReDex 后必须验证安装、启动、关键路径、签名、zipalign 和 apksigner，不只看 APK 变小。",
    "排查问题时使用 `--stop-pass`、`TRACE=1` 和中间 DEX，不盲目删 pass。",
    "需要安装、pass 参数或故障排查细节时分别读取 installation、passes、troubleshooting 或 quickstart reference。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不验证签名对齐",
      pass: "完整 CI 链路",
    }),
    defineAntiPattern({
      fail: "激进 pass 组合：过度优化导致运行时崩溃 / 反射失效",
      pass: "渐进启用",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "根据用户意图选择路径：安装、pass 选择、基本集成、优化问题排查或 pass 原理解释。",
      "基本集成先读取 `quickstart`，确认输入 APK、配置文件、Android SDK、签名材料和输出路径。",
      "选择 pass 时读取 `passes`，按体积、性能、调试信息或风险级别渐进组合。",
      "接入 Gradle 或 CI 时把 ReDex 放在 `assembleRelease` 后，并保留 zipalign、apksigner 和安装启动验证。",
      "优化后异常时读取 `troubleshooting`，使用 `--stop-pass`、mapping、keep 规则和 `TRACE=1` 缩小责任 pass。",
      "输出结论时同时报告优化收益、验证覆盖、风险 pass 和回滚路径。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "ReDex 安装 / 配置 / pass 选择建议和输入输出文件约定。",
      "Gradle / CI 集成步骤、签名对齐和验证命令。",
      "优化前后体积 / 启动 / 运行验证结果，以及失败定位路径。",
      "高风险 pass、keep 规则、回滚方案和剩余兼容性风险。",
    ],
  }),
  references: [
    defineReference({
      id: "quickstart",
      source: new URL("./references/quickstart.md", import.meta.url),
      target: "references/quickstart.md",
      title: "ReDex 快速开始与 Gradle 集成",
      summary: "ReDex CLI、默认 pass 配置、关键参数、pass 参数格式和 Gradle 后处理示例。",
      loadWhen: "需要快速运行 ReDex、写配置文件或接入 Gradle / CI 时读取。",
    }),
    defineReference({
      id: "installation",
      source: new URL("./references/installation.md", import.meta.url),
      target: "references/installation.md",
      title: "installation.md",
      summary: "ReDex 工具安装指南：源码编译与预构建包选择。",
      loadWhen: "需要安装或更新 ReDex 工具链时读取。",
    }),
    defineReference({
      id: "passes",
      source: new URL("./references/passes.md", import.meta.url),
      target: "references/passes.md",
      title: "passes.md",
      summary: "ReDex Pass 详解：各 pass 功能、配置参数与优化效果。",
      loadWhen: "需要选择或配置 ReDex 优化 pass、评估优化组合风险时读取。",
    }),
    defineReference({
      id: "troubleshooting",
      source: new URL("./references/troubleshooting.md", import.meta.url),
      target: "references/troubleshooting.md",
      title: "troubleshooting.md",
      summary: "ReDex 优化问题排查：运行时崩溃、反射失效与签名校验失败。",
      loadWhen: "需要诊断 ReDex 优化后出现的运行时异常或兼容性问题时读取。",
    }),
  ],
});
