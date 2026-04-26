# devops-expert

DevOps 专家插件，覆盖 Docker/Helm/K8s、CI/CD 流水线、Nginx 配置、监控告警和事件响应。

- `hooks/dispatch.mjs`：统一分发 DevOps 专有的 `PostToolUse Edit|Write` 校验器。
- `skills/*/SKILL.md`：全部采用中文统一结构，便于按场景快速触发。

## Skills

| Skill | 用途 |
|-------|------|
| `docker-essentials` | Docker 容器管理与镜像操作 |
| `helm-chart-scaffolding` | Helm Chart 设计与 K8s 部署 |
| `gitlab-ci-patterns` | GitLab CI/CD 多阶段流水线 |
| `create-github-action-workflow-specification` | GitHub Actions 工作流规范生成 |
| `gh-fix-ci` | GitHub Actions 检查失败定位与修复 |
| `gh-address-comments` | GitHub PR 评论归类与处理 |
| `monitoring-observability` | 监控、日志与可观测性体系搭建 |
| `nginx-config-optimizer` | Nginx 配置性能/安全/缓存优化 |
| `service-monitor` | 服务健康检查与端点监控 |
| `incident-triage` | 线上事件分级响应与排查 |
| `log-analyzer` | 日志调查与错误追踪 |
| `openapi-spec-generation` | OpenAPI 3.1 规范生成与维护 |

## Agents

| Agent | 用途 |
|-------|------|
| `infra-auditor` | 基础设施配置只读审计：Docker、CI/CD、Helm、Nginx、Terraform 与部署清单 |

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

Shell 语法检查与 ShellCheck 统一由 [linux-expert](../linux-expert/README.md) 提供；通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供。若使用 `--plugin-dir` 单独加载本插件，请同时加载它们。

## 安装

```bash
claude --plugin-dir /path/to/plugins/devops-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install devops-expert@ai-experts
claude plugin install devops-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall devops-expert
claude plugin uninstall devops-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证命令

```bash
jq empty plugins/devops-expert/hooks/hooks.json
find plugins/devops-expert/hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test plugins/devops-expert/tests/*.test.mjs
```
