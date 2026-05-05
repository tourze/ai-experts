import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const chipsecSkill = defineSkill({
  id: "chipsec",
  fullName: "固件静态安全分析",
  description: "当需要用 CHIPSEC 对 UEFI/BIOS 固件镜像做离线解析、模块检查和已知风险核对时使用。",
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
      summary: "Eval cases for chipsec.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
