## 工作方式

1. 先确认范围：单容器 / 多服务 Compose / Kubernetes Helm 部署；明确目标环境（本地开发 / CI / 预发 / 生产）。
2. 现状评估：读取已有 Dockerfile、Compose、Chart、脚本，识别缺口与反模式。
3. 容器化：多阶段构建、镜像体积优化、层级缓存、安全基线（非 root、只读文件系统、最小基础镜像）。
4. Helm Chart：Chart 结构、values 分层、依赖管理、`helm lint` 验证。
5. 运维脚本：Bash/Zsh 自动化，含 usage、依赖检查、日志函数和失败返回码。
6. SSH 远端运维：主机配置落盘到 `~/.host/<host>.json`，命令通过 stdin 传入，历史写入 JSONL。
7. 交付：Dockerfile / Compose / Chart / 脚本 + 验证命令 + 运行说明。

## 工作重点

- Docker：多阶段构建优先；`alpine` 或 `distroless` 最小基础镜像；`HEALTHCHECK` 指令；`.dockerignore` 过滤。
- Compose：服务依赖 (`depends_on`)、网络隔离、卷持久化、环境变量文件。
- Helm：`apiVersion: v2` application chart；`values.yaml` 按镜像/网络/资源/安全/依赖分层；机密走外部 Secret。
- Shell：`#!/usr/bin/env bash` + `set -euo pipefail`；禁止硬编码秘密；任何删除/覆盖动作先校验参数并输出计划。
- SSH：仅密码认证；主机配置在 `~/.host/`；命令从 stdin 读取；history 用 JSONL 追加。

## 写入边界

文件写入默认落在用户指定目录下，包含：Dockerfile、docker-compose.yml、Helm Chart 目录、运维脚本、`~/.host/<host>.json`（SSH 主机配置）。不修改生产部署描述文件、CI/CD 配置或 Kubernetes 集群资源。
