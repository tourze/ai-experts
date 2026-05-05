import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const chipsecSkill = defineSkill({
  id: "chipsec",
  fullName: "固件静态安全分析",
  description: "当需要用 CHIPSEC 对 UEFI/BIOS 固件镜像做离线解析、模块检查和已知风险核对时使用。",
  useCases: [
    "需要对 `.bin`、`.rom`、`.fd`、`.cap` 等固件镜像做结构和安全配置分析。",
    "需要在离线环境先做快速风险筛查，再决定是否进入更细的固件逆向。",
    "需要结合 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 深挖 EFI 可执行模块。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
