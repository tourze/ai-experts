import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "生产容器内临时修复：状态漂移：下次重启回到原始镜像，\"修复\"消失。",
      pass: "改 Dockerfile 重新构建",
    }),
    defineAntiPattern({
      fail: "容器在跑就算健康",
      pass: "检查日志和健康状态",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "用 Docker 构建、运行、排障和清理容器/镜像/网络/卷，优先保留证据并避免破坏共享资源。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认容器名、镜像标签、端口映射、卷挂载、网络、环境变量和目标平台。",
      "排障先看 `docker ps`、`docker logs`、`docker inspect`、退出码和 healthcheck，再决定重建或删除。",
      "构建与发布使用固定版本标签、构建参数和目标平台；生产修复改 Dockerfile 后重建，不在容器内漂移。",
      "Compose 环境用 `docker compose ps/logs/exec/up/down` 递进；删除镜像、卷、网络前确认影响范围。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "容器/镜像/网络/卷的当前状态、日志、inspect 摘要和健康检查结果。",
      "构建、运行、Compose 调试或清理命令，以及每个命令的影响范围。",
      "问题根因、修复路径、持久化到 Dockerfile/Compose 的修改点和验证结果。",
    ],
  }),
  tools: [],
});
