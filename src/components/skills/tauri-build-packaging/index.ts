import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
      pass: "命名按 target_triple：详见 [references/](references/)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "build-packaging-patterns",
      source: new URL("./references/build-packaging-patterns.md", import.meta.url),
      target: "references/build-packaging-patterns.md",
      title: "build-packaging-patterns.md",
      summary: "Reference material for tauri-build-packaging.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
