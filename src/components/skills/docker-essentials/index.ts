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
  constraints: [
    "优先使用显式版本标签，避免 `latest`。",
    "排障先看 `ps / logs / inspect`，再建议重建或删除。",
    "删除镜像、卷、网络前先确认影响范围，尤其是共享卷。",
    "新项目优先使用 `docker compose`，仅在遗留仓库明确要求时使用 `docker-compose`。",
  ],
  checklist: [
    "是否确认容器名、镜像标签、端口映射和卷挂载。",
    "是否检查容器退出码、最近日志和健康检查状态。",
    "是否确认网络连通性、DNS 与环境变量注入方式。",
    "是否为镜像构建设置固定标签、构建参数和目标平台。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
