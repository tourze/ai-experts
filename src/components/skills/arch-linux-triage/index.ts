import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { networkTroubleshooterSkill } from "../network-troubleshooter/index";
import { systemDiagnosticsSkill } from "../system-diagnostics/index";

export const archLinuxTriageSkill = defineSkill({
  id: "arch-linux-triage",
  fullName: "Arch Linux 排障",
  description: "当用户遇到 Arch Linux 的 pacman、systemd、滚动升级、AUR、内核或启动故障时使用。",
  useCases: [
    "用户提到 `pacman`、`mkinitcpio`、`systemd`、AUR、滚动升级后故障、启动失败或驱动回退。",
    "需要先做基线采样时，先运行 `system-diagnostics`。",
    "涉及 DNS、链路或端口不可达时，联动 `network-troubleshooter`。",
  ],
  constraints: [
    "严禁建议 `pacman -Sy` 单独刷新数据库；Arch 不允许 partial upgrade。",
    "先采样再修复：优先保留 `journalctl`、`pacman.log`、`uname -a` 与失败服务状态。",
    "涉及引导、initramfs、显卡驱动时，必须明确内核版本和最近一次升级时间。",
    "AUR 包与官方仓库问题分开处理，避免把第三方构建失败误判为系统损坏。",
  ],
  checklist: [
    "[ ] 确认 `cat /etc/os-release`、`uname -a`、`pacman -Q linux` 的输出一致。",
    "[ ] 查看 `systemctl --failed` 与 `journalctl -b -p err..alert --no-pager`。",
    "[ ] 检查 `/var/log/pacman.log` 中最近一次升级、回滚或镜像错误。",
    "[ ] 若涉及包损坏，先用 `pacman -Qikk <pkg>` 验证再决定重装。",
    "[ ] 若涉及引导，确认 `mkinitcpio -P`、`bootctl status` 或 GRUB 生成是否成功。",
  ],
  relatedSkills: [
    {
      get id() {
        return systemDiagnosticsSkill.id;
      },
      reason: "需要先做基线采样时，先运行 `system-diagnostics`。",
    },
    {
      get id() {
        return networkTroubleshooterSkill.id;
      },
      reason: "涉及 DNS、链路或端口不可达时，联动 `network-troubleshooter`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
