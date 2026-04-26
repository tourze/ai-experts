# linux-expert

Linux 系统专家插件，覆盖 Shell 守卫、发行版问题排查、磁盘/网络/性能诊断。

## 结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 与 3 个本地 `PostToolUse Edit|Write` 守卫脚本。
- `skills/`：8 个 Linux 专向技能文档，统一采用中文结构。
- `tests/`：manifest、dispatch、hook 逻辑、SKILL 文档与示例校验。

## Skills

| Skill | 用途 |
|-------|------|
| `arch-linux-triage` | Arch Linux 问题排查（pacman/systemd/滚动更新） |
| `centos-linux-triage` | CentOS 问题排查（RHEL 兼容/SELinux） |
| `debian-linux-triage` | Debian 问题排查（apt/systemd/AppArmor） |
| `linux-shell-scripting` | Bash 脚本编写与自动化 |
| `disk-cleanup` | 磁盘空间清理与大文件定位 |
| `system-diagnostics` | 系统健康检查与资源诊断 |
| `performance-optimizer` | 系统性能调优与资源释放 |
| `network-troubleshooter` | 网络连通性/DNS/服务可达性排查 |

## 外部依赖

- `bash`：`syntax-bash.mjs` 的语法检查依赖。
- `zsh`：`syntax-zsh.mjs` 的语法检查依赖。
- `shellcheck`：`lint-shellcheck.mjs` 可选依赖；未安装时自动降级为仅检查 `set -euo pipefail`。

## Agents

| Agent | 用途 |
|-------|------|
| `system-diagnostician` | perform read-only system health checks on Linux hosts |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PostToolUse Edit\|Write | `syntax-bash` | `bash -n` 语法检查 |
| PostToolUse Edit\|Write | `syntax-zsh` | Zsh 语法检查 |
| PostToolUse Edit\|Write | `lint-shellcheck` | ShellCheck 静态分析 |
| PostToolUse Edit\|Write | `debug-statement-guard`（由 `coding-expert` 提供） | set -x 等调试语句检测 |

通用 BOM / UTF-8 编码检查、跨语言调试语句检测和文件预算守卫统一由 [coding-expert](../coding-expert/README.md) 提供；若使用 `--plugin-dir` 单独加载本插件，请同时加载它。

## 安装

```bash
claude --plugin-dir /path/to/plugins/linux-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install linux-expert@ai-experts
claude plugin install linux-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall linux-expert
claude plugin uninstall linux-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证

```bash
python3 -m json.tool plugins/linux-expert/hooks/hooks.json >/dev/null
node --check plugins/linux-expert/hooks/dispatch.mjs
for f in plugins/linux-expert/hooks/post-tool-use/edit-write/*.mjs; do
  node --check "$f"
done
node --test plugins/linux-expert/tests/*.mjs
```
