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
