import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
    "确认 `cat /etc/os-release`、`uname -a`、`pacman -Q linux` 的输出一致。",
    "查看 `systemctl --failed` 与 `journalctl -b -p err..alert --no-pager`。",
    "检查 `/var/log/pacman.log` 中最近一次升级、回滚或镜像错误。",
    "若涉及包损坏，先用 `pacman -Qikk <pkg>` 验证再决定重装。",
    "若涉及引导，确认 `mkinitcpio -P`、`bootctl status` 或 GRUB 生成是否成功。",
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
  antiPatterns: [
    defineAntiPattern({
      fail: "pacman -Sy 单独刷新",
      pass: "必须 -Syu 完整升级",
    }),
    defineAntiPattern({
      fail: "删 pacman 数据库",
      pass: "用 -Qikk 验证",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先采样 `cat /etc/os-release`、`uname -a`、`systemctl --failed`、`journalctl -b -p err..alert` 和 `/var/log/pacman.log`。",
      "确认内核包、运行内核、最近一次升级时间和失败服务状态；AUR 与官方仓库问题分开归因。",
      "包损坏先用 `pacman -Qikk <pkg>` 验证；升级修复必须走完整 `pacman -Syu`，禁止单独 `pacman -Sy`。",
      "引导、initramfs 或显卡驱动问题再检查 `mkinitcpio -P`、`bootctl status` 或 GRUB 生成结果。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "发行版、内核、失败服务、pacman 最近记录和升级/回滚时间线。",
      "官方仓库、AUR、内核/initramfs、引导、驱动或网络问题的归因证据。",
      "最小修复动作、风险、回滚点和需要转给 system/network skill 的条件。",
    ],
  }),
});
