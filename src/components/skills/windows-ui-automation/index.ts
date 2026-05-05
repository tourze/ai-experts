import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const windowsUiAutomationSkill = defineSkill({
  id: "windows-ui-automation",
  fullName: "windows-ui-automation",
  description: "当用户自动化 Windows 桌面操作、UIA 元素定位或 Win32 输入仿真时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for windows-ui-automation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "security-examples",
      source: new URL("./references/security-examples.md", import.meta.url),
      target: "references/security-examples.md",
      title: "security-examples.md",
      summary: "Reference material for windows-ui-automation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "threat-model",
      source: new URL("./references/threat-model.md", import.meta.url),
      target: "references/threat-model.md",
      title: "threat-model.md",
      summary: "Reference material for windows-ui-automation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for windows-ui-automation.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
