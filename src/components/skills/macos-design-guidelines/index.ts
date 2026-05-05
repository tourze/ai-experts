import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const macosDesignGuidelinesSkill = defineSkill({
  id: "macos-design-guidelines",
  description: "当用户要按 macOS HIG 设计桌面界面、菜单栏、窗口层级、工具栏、侧边栏、键盘快捷键或指针交互时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for macos-design-guidelines.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
