import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const reactNativeDesignSkill = defineSkill({
  id: "react-native-design",
  fullName: "React Native 设计实现",
  description: "当用户需要实现 RN 样式、导航结构、手势交互、Reanimated 动画、跨端布局或移动端视觉组件时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "navigation-patterns",
      source: new URL("./references/navigation-patterns.md", import.meta.url),
      target: "references/navigation-patterns.md",
      title: "navigation-patterns.md",
      summary: "Reference material for react-native-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "reanimated-patterns",
      source: new URL("./references/reanimated-patterns.md", import.meta.url),
      target: "references/reanimated-patterns.md",
      title: "reanimated-patterns.md",
      summary: "Reference material for react-native-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styling-patterns",
      source: new URL("./references/styling-patterns.md", import.meta.url),
      target: "references/styling-patterns.md",
      title: "styling-patterns.md",
      summary: "Reference material for react-native-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for react-native-design.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
