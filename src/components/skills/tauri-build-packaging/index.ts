import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const tauriBuildPackagingSkill = defineSkill({
  id: "tauri-build-packaging",
  fullName: "Tauri v2 构建与分发",
  description: "当用户要打包桌面应用、bundle 配置、代码签名、公证、自动更新、sidecar、externalBin、CI 矩阵或体积优化时使用。",
  useCases: [
    "配置 bundle 段（图标、资源、sidecar、安装器）",
    "macOS 公证、Windows Authenticode 签名",
    "`tauri-plugin-updater` 自动更新",
    "GitHub Actions 多平台 CI/CD",
    "产物体积优化",
  ],
  constraints: [
    "签名密钥绝不提交仓库；CI secrets 注入",
    "macOS 需 Developer ID + Notarization",
    "Windows 需 EV/OV 证书过 SmartScreen",
    "Updater 密钥用 `cargo tauri signer generate`；私钥存 CI，公钥写 conf",
    "Sidecar 遵循 `name-{target_triple}` 命名",
    "`bundle.resources` 运行时通过 `resolve_resource()` 访问",
    "干净环境测试构建产物",
    "CI 分别缓存 `target/` 和 `node_modules/`",
  ],
  checklist: [
    "仓库无 `.key` 文件？",
    "macOS 完整签名链？Windows 有证书？",
    "Updater pubkey 已填入？端点 HTTPS？",
    "Release profile 开启 LTO + strip？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "私钥提交仓库",
      pass: "CI secrets 注入",
    }),
    defineAntiPattern({
      fail: "macOS 只签名不公证",
      pass: "签名 + 公证 + 装订",
    }),
    defineAntiPattern({
      fail: "Sidecar 不加 target triple",
      pass: "命名按 target_triple：详见 [build-packaging-patterns](references/build-packaging-patterns.md)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认目标平台、安装器格式、签名证书、CI 环境、自动更新需求和外部二进制/资源清单。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取 `build-packaging-patterns` reference，配置 bundle、resources、sidecar、updater、公证和平台签名。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "检查密钥边界：私钥和证书只通过 CI secrets 注入，仓库只保留公钥和非敏感配置。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "按平台分别验证 macOS 签名/公证/装订、Windows Authenticode/SmartScreen、Linux 包格式和依赖。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "优化 release profile、缓存策略和构建矩阵，确保干净环境能复现产物。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出发布前检查清单、CI 变量、构建命令和失败回滚路径。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "平台构建/分发矩阵和 bundle 配置。",
      "签名、公证、updater、sidecar 和资源访问配置。",
      "CI secrets、缓存、release profile 和构建命令。",
      "发布前验证清单、失败排查和回滚方案。",
    ],
  }),
  references: [
    defineReference({
      id: "build-packaging-patterns",
      source: new URL("./references/build-packaging-patterns.md", import.meta.url),
      target: "references/build-packaging-patterns.md",
      title: "build-packaging-patterns.md",
      summary: "Tauri 桌面应用构建、bundle 配置、代码签名、公证和自动更新的完整流程与配置参考。",
      loadWhen: "需要配置 macOS 公证、Windows 签名、updater 或 CI 多平台构建时读取。",
    }),
  ],
});
