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
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为 React Native Metro 配置 monorepo、resolver、平台扩展和 CI 性能优化，避免打包器边界失控。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认项目结构、包管理器、workspace 边界、平台扩展、CI 环境和当前 Metro 报错/性能症状。",
      "monorepo 或 workspace 问题读取 `monorepo-config` reference，核对 `watchFolders`、resolver 和重复依赖。",
      "自定义平台后缀读取 `custom-platform-exts` reference，确认扩展顺序和平台目标。",
      "CI 慢或缓存不稳定读取 `ci-performance-config` reference，拆分 Metro、node_modules 和构建缓存。",
      "验证配置不会引入重复 React/RN、错误 symlink 解析或平台文件优先级错乱。",
      "输出 Metro 配置变更、风险、验证命令和回滚方式。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Metro 问题类型、项目结构和 resolver 约束。",
      "monorepo/watchFolders/custom platform/CI 配置方案。",
      "重复依赖、平台扩展顺序和缓存风险检查。",
      "验证命令、性能对比和回滚方案。",
    ],
  }),
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
