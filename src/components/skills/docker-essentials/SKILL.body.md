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

## 反模式

### FAIL: 生产容器内临时修复

```bash
docker exec -it prod-api sh
# 在容器里 vim 改配置、pip install 补依赖
```

→ 状态漂移：下次重启回到原始镜像，"修复"消失。

### PASS: 改 Dockerfile 重新构建

```bash
# 修改 Dockerfile 或配置 → 构建新镜像 → 滚动更新
docker build -t my-app:1.2.4 .
docker compose up -d --no-deps api
```

### FAIL: 容器在跑就算健康

```bash
docker ps  # STATUS: Up 3 hours → "没问题"
```

### PASS: 检查日志和健康状态

```bash
docker inspect --format='{{.State.Health.Status}}' api  # unhealthy
docker logs --tail 50 api  # 发现 OOM 后重启循环
```
