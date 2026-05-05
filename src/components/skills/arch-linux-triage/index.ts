import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const archLinuxTriageSkill = defineSkill({
  id: "arch-linux-triage",
  fullName: "Arch Linux 排障",
  description: "当用户遇到 Arch Linux 的 pacman、systemd、滚动升级、AUR、内核或启动故障时使用。",
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
      summary: "Eval cases for arch-linux-triage.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
