import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const dockerEssentialsSkill = defineSkill({
  id: "docker-essentials",
  description: "当用户需要构建、运行、排障或清理 Docker 容器、镜像、网络和卷时使用。",
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
      summary: "Eval cases for docker-essentials.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
