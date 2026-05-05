import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const reactNativePlatformForkSkill = defineSkill({
  id: "react-native-platform-fork",
  fullName: "跨平台代码组织",
  description: "当用户要组织 React Native 跨平台代码或配置平台分叉时使用。用户提到平台分叉、跨端代码、.native.ts、.tauri.ts、Platform.select 时触发。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "adapter-interface",
      source: new URL("./references/adapter-interface.md", import.meta.url),
      target: "references/adapter-interface.md",
      title: "adapter-interface.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "boundary-file-pattern",
      source: new URL("./references/boundary-file-pattern.md", import.meta.url),
      target: "references/boundary-file-pattern.md",
      title: "boundary-file-pattern.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "metro-custom-platforms",
      source: new URL("./references/metro-custom-platforms.md", import.meta.url),
      target: "references/metro-custom-platforms.md",
      title: "metro-custom-platforms.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "platform-select-values",
      source: new URL("./references/platform-select-values.md", import.meta.url),
      target: "references/platform-select-values.md",
      title: "platform-select-values.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "react-native-macos",
      source: new URL("./references/react-native-macos.md", import.meta.url),
      target: "references/react-native-macos.md",
      title: "react-native-macos.md",
      summary: "Reference material for react-native-platform-fork.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for react-native-platform-fork.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
