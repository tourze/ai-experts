import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const memoryForensicsSkill = defineSkill({
  id: "memory-forensics",
  fullName: "内存取证",
  description: "当需要分析 RAM 镜像中的进程、注入、网络连接、凭据痕迹或 rootkit 线索时使用。",
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
      summary: "Eval cases for memory-forensics.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
