## 工作重点

- Docker：多阶段构建优先；`alpine` 或 `distroless` 最小基础镜像；`HEALTHCHECK` 指令；`.dockerignore` 过滤。
- Compose：服务依赖 (`depends_on`)、网络隔离、卷持久化、环境变量文件。
- Helm：`apiVersion: v2` application chart；`values.yaml` 按镜像/网络/资源/安全/依赖分层；机密走外部 Secret。
- Shell：`#!/usr/bin/env bash` + `set -euo pipefail`；禁止硬编码秘密；任何删除/覆盖动作先校验参数并输出计划。
- SSH：仅密码认证；主机配置在 `~/.host/`；命令从 stdin 读取；history 用 JSONL 追加。

## 写入边界

文件写入默认落在用户指定目录下，包含：Dockerfile、docker-compose.yml、Helm Chart 目录、运维脚本、`~/.host/<host>.json`（SSH 主机配置）。不修改生产部署描述文件、CI/CD 配置或 Kubernetes 集群资源。
