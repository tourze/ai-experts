import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
      summary: "Reference material for react-native-metro-config.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "custom-platform-exts",
      source: new URL("./references/custom-platform-exts.md", import.meta.url),
      target: "references/custom-platform-exts.md",
      title: "custom-platform-exts.md",
      summary: "Reference material for react-native-metro-config.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "monorepo-config",
      source: new URL("./references/monorepo-config.md", import.meta.url),
      target: "references/monorepo-config.md",
      title: "monorepo-config.md",
      summary: "Reference material for react-native-metro-config.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "react-native-bundle-size",
      source: new URL("./references/react-native-bundle-size.md", import.meta.url),
      target: "references/react-native-bundle-size.md",
      title: "react-native-bundle-size.md",
      summary: "Reference material for react-native-metro-config.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "upgrading-react-native",
      source: new URL("./references/upgrading-react-native.md", import.meta.url),
      target: "references/upgrading-react-native.md",
      title: "upgrading-react-native.md",
      summary: "Reference material for react-native-metro-config.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
