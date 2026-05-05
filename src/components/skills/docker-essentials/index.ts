import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const dockerEssentialsSkill = defineSkill({
  id: "docker-essentials",
  fullName: "Docker 基础操作",
  description: "当用户需要构建、运行、排障或清理 Docker 容器、镜像、网络和卷时使用。",
  useCases: [
    "启动、停止、重建容器。",
    "查看日志、进入容器、排查端口与挂载问题。",
    "构建镜像、打标签、推送制品。",
    "使用 Compose 管理多服务开发环境。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
