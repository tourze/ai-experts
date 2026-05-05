import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const windowsKernelSecuritySkill = defineSkill({
  id: "windows-kernel-security",
  description: "当用户分析或审计 Windows 内核对象、驱动边界、PatchGuard、VBS、HVCI 或 IOCTL 时使用。",
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
      summary: "Eval cases for windows-kernel-security.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
