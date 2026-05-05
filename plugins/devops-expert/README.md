# devops-expert

DevOps 专家能力，覆盖 Docker/Helm/K8s、CI/CD 流水线、Nginx 配置、监控告警和事件响应。

- `hooks/`：8 个 DevOps 专有的 `PostToolUse Edit|Write` 校验器。
- `skills/*/SKILL.md`：全部采用中文统一结构，便于按场景快速触发。

## Skills

| Skill | 用途 |
|-------|------|
| `arch-linux-triage` | Arch Linux 的 pacman、systemd、滚动升级、AUR、内核或启动故障排查 |
| `docker-essentials` | Docker 容器管理与镜像操作 |
| `gh-fix-ci` | GitHub Actions 检查失败定位与修复 |
| `gitlab-ci-patterns` | GitLab CI/CD 多阶段流水线 |
| `helm-chart-scaffolding` | Helm Chart 设计与 K8s 部署 |
| `incident-response` | 事故全生命周期：证据驱动分级诊断 → 时间线构建 → 根因定位 → 止血决策 → 修复路线 → 观测补齐 |
| `linux-shell-scripting` | Bash/Zsh 自动化、运维脚本与命令行工具 |
| `log-analyzer` | 日志调查与错误追踪 |
| `monitoring-observability` | 监控、日志与可观测性体系搭建 |
| `network-troubleshooter` | Linux 网络不通、DNS、端口、TLS 与链路排障 |
| `openapi-spec-generation` | OpenAPI 3.1 规范生成与维护 |
| `remote-ssh-command` | 通过 SSH 在远端机器执行命令并记录审计历史 |
| `system-diagnostics` | Linux 主机健康检查、瓶颈与误配置定位 |

## Agents

| Agent | 用途 |
|-------|------|
| `ci-pipeline-fixer` | GitHub Actions / GitLab CI 失败排查、流水线规格生成、PR 评论处理，可写 .github/.gitlab-ci |
| `incident-responder` | 线上事故应急响应：时间线还原、根因定位、止血与修复路线规划，只读 |
| `infrastructure-engineer` | 基础设施工程：Docker、Helm、Shell、远端命令与部署文档，可写 IaC / 运维草案 |
| `observability-engineer` | 端到端可观测性建设：指标/日志/告警/健康检查设计、Python/Go 语言落地、日志分析与事故分级，可写观测方案与落地脚本 |
| `system-diagnostician` | Linux 主机只读健康检查：CPU、内存、磁盘、网络、服务和日志，定位瓶颈与误配置 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-dockerfile` | Dockerfile 语法检查 |
| PostToolUse Edit\|Write | `syntax-yaml` | YAML 语法检查 |
| PostToolUse Edit\|Write | `syntax-bash`（由 `linux-expert` 提供） | Bash 脚本语法检查 |
| PostToolUse Edit\|Write | `lint-actionlint` | GitHub Actions 工作流校验 |
| PostToolUse Edit\|Write | `lint-kubeconform` | Kubernetes manifest 校验 |
| PostToolUse Edit\|Write | `lint-terraform-fmt` | Terraform 格式检查 |
| PostToolUse Edit\|Write | `lint-shellcheck`（由 `linux-expert` 提供） | Shell 脚本静态分析 |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | 调试断点与调试输出检测 |

Shell 语法检查与 ShellCheck 统一由 [linux-expert](../linux-expert/README.md) 提供；通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find plugins/devops-expert/hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/devops-expert/tests/*.test.mjs
```
