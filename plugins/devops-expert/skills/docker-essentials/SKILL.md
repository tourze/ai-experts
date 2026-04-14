---
name: docker-essentials
description: 当用户需要构建、运行、排障或清理 Docker 容器、镜像、网络和卷时使用。
---

# Docker 基础操作

## 适用场景
- 启动、停止、重建容器。
- 查看日志、进入容器、排查端口与挂载问题。
- 构建镜像、打标签、推送制品。
- 使用 Compose 管理多服务开发环境。

## 核心约束
- 优先使用显式版本标签，避免 `latest`。
- 排障先看 `ps / logs / inspect`，再建议重建或删除。
- 删除镜像、卷、网络前先确认影响范围，尤其是共享卷。
- 新项目优先使用 `docker compose`，仅在遗留仓库明确要求时使用 `docker-compose`。

## 代码模式
- 容器生命周期：

```bash
docker run --name web -d -p 8080:80 nginx:1.27-alpine
docker ps
docker logs --tail 100 -f web
docker exec -it web sh
docker stop web
docker rm web
```

- 镜像构建与发布：

```bash
docker build -t registry.example.com/my-app:1.2.3 .
docker tag registry.example.com/my-app:1.2.3 registry.example.com/my-app:stable
docker push registry.example.com/my-app:1.2.3
```

- Compose 调试：

```bash
docker compose up -d
docker compose ps
docker compose logs --tail 200 api
docker compose exec api sh
docker compose down
```

## 检查清单
- 是否确认容器名、镜像标签、端口映射和卷挂载。
- 是否检查容器退出码、最近日志和健康检查状态。
- 是否确认网络连通性、DNS 与环境变量注入方式。
- 是否为镜像构建设置固定标签、构建参数和目标平台。
- 如果容器后面挂了反向代理，参阅 [nginx-config-optimizer](../nginx-config-optimizer/SKILL.md)。
- 如果要把容器纳入巡检，参阅 [service-monitor](../service-monitor/SKILL.md)。

## 反模式
- 直接执行 `docker system prune -a` 清理未知环境。
- 在未确认数据位置时删除匿名卷或共享卷。
- 用 `docker exec` 临时改生产容器，把状态漂移当修复。
- 只看容器是否在跑，不看日志、健康检查和退出码。
