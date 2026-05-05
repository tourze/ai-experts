import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const androidRedexSkill = defineSkill({
  id: "android-redex",
  fullName: "ReDex — Android 字节码优化",
  description: "当用户要用 ReDex 优化 Android APK 体积/性能、配置 pass 或排查优化问题时使用。",
  useCases: [
    "当用户要用 ReDex 优化 Android APK 体积/性能、配置 pass 或排查优化问题时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "installation",
      source: new URL("./references/installation.md", import.meta.url),
      target: "references/installation.md",
      title: "installation.md",
      summary: "Reference material for android-redex.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "passes",
      source: new URL("./references/passes.md", import.meta.url),
      target: "references/passes.md",
      title: "passes.md",
      summary: "Reference material for android-redex.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "troubleshooting",
      source: new URL("./references/troubleshooting.md", import.meta.url),
      target: "references/troubleshooting.md",
      title: "troubleshooting.md",
      summary: "Reference material for android-redex.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
