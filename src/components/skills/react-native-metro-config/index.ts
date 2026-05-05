import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const reactNativeMetroConfigSkill = defineSkill({
  id: "react-native-metro-config",
  fullName: "Metro 配置",
  description: "当用户要配置或排查 React Native Metro 打包器时使用。用户提到 Metro 配置、watchFolders、inlineRequires、打包慢、自定义 resolver 时触发。",
  useCases: [
    "配置 Monorepo 下 Metro 的路径解析和包发现时。",
    "添加自定义平台扩展名（.tauri.ts、.macos.ts）时。",
    "排查热更新失效、模块找不到或 CI 打包 OOM 时。",
  ],
  constraints: [
    "`inlineRequires: true` 改变初始化顺序，须充分回归测试。",
    "`watchFolders` 必须含 Monorepo 根和所有 symlink 包目录。",
    "`extraNodeModules` 用绝对路径；`react` 须指向 app 本地版本。",
    "自定义 `sourceExts` 平台特定在前、通用在后。",
    "不在 `assetExts` 中的扩展名会被当 JS 解析。",
    "CI 中 `maxWorkers` 控制在 2-4 避免 OOM。",
    "`import()` 不支持计算路径，须静态字符串。",
  ],
  checklist: [
    "`watchFolders` 是否覆盖所有 symlink 包？",
    "`react`/`react-native` 是否唯一解析到 app 版本？",
    "CI `maxWorkers` 是否已调低？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "monorepo 漏 watchFolders",
      pass: "显式 watchFolders",
    }),
    defineAntiPattern({
      fail: "视频塞 sourceExts",
      pass: "assetExts",
    }),
    defineAntiPattern({
      fail: "CI 不限 maxWorkers",
      pass: "按环境分",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ci-performance-config",
      source: new URL("./references/ci-performance-config.md", import.meta.url),
      target: "references/ci-performance-config.md",
      title: "ci-performance-config.md",
      summary: "Metro 打包器在 CI 环境下的性能配置方案，包括 maxWorkers 和内存控制。",
      loadWhen: "需要优化 CI 中 Metro 打包速度或避免 OOM 时读取。",
    }),
    defineReference({
      id: "custom-platform-exts",
      source: new URL("./references/custom-platform-exts.md", import.meta.url),
      target: "references/custom-platform-exts.md",
      title: "custom-platform-exts.md",
      summary: "Metro 自定义平台扩展名的配置方法和使用规范。",
      loadWhen: "需要添加自定义平台扩展名（如 .tauri.ts、.macos.ts）时读取。",
    }),
    defineReference({
      id: "monorepo-config",
      source: new URL("./references/monorepo-config.md", import.meta.url),
      target: "references/monorepo-config.md",
      title: "monorepo-config.md",
      summary: "Monorepo 场景下 Metro 的路径解析、watchFolders 和包发现配置。",
      loadWhen: "需要配置 Monorepo 中 Metro 的路径解析和包发现时读取。",
    }),
    defineReference({
      id: "react-native-bundle-size",
      source: new URL("./references/react-native-bundle-size.md", import.meta.url),
      target: "references/react-native-bundle-size.md",
      title: "react-native-bundle-size.md",
      summary: "React Native 打包体积分析与优化策略。",
      loadWhen: "需要分析或优化 React Native 打包体积时读取。",
    }),
    defineReference({
      id: "upgrading-react-native",
      source: new URL("./references/upgrading-react-native.md", import.meta.url),
      target: "references/upgrading-react-native.md",
      title: "upgrading-react-native.md",
      summary: "React Native 版本升级指南与常见问题解决方案。",
      loadWhen: "需要规划或执行 React Native 版本升级时读取。",
    }),
  ],
});
