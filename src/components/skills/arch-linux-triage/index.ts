import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const archLinuxTriageSkill = defineSkill({
  id: "arch-linux-triage",
  fullName: "Arch Linux 排障",
  description: "当用户遇到 Arch Linux 的 pacman、systemd、滚动升级、AUR、内核或启动故障时使用。",
  useCases: [
    "用户提到 `pacman`、`mkinitcpio`、`systemd`、AUR、滚动升级后故障、启动失败或驱动回退。",
    "需要先做基线采样时，先运行 [system-diagnostics](../system-diagnostics/SKILL.md)。",
    "涉及 DNS、链路或端口不可达时，联动 [network-troubleshooter](../network-troubleshooter/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
