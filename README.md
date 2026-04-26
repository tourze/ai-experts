# ai-experts

一个同时兼容 **Claude Code** 和 **OpenAI Codex CLI** 的本地插件仓库，按领域提供 `*-expert` 插件集合。安装脚本将 `plugins/<plugin>/skills/<skill>` 直接软链到 `~/.claude/skills/` 与 `~/.codex/skills/`，把 agents 链到 `~/.claude/agents/`，并把统一 hook dispatcher 注入两端的 settings/hooks 配置（不再依赖 marketplace plugin 安装）。每个插件包含自己的 README、skills 与最小回归测试，并可按需提供 `hooks/` 与 `agents/`。

## 快速开始

前提：本机已安装 `claude` CLI 和/或 [Codex CLI](https://github.com/openai/codex)。

### 一键安装

脚本会自动检测已安装的 CLI 工具（Claude Code / Codex CLI），注册 marketplace 并启用全部插件：

```bash
./scripts/install.sh
```

安装时还会把仓库根目录的 [`MEMORY.md`](MEMORY.md) 链接到全局记忆文件：
- Claude Code: `~/.claude/CLAUDE.md`
- Codex CLI: `~/.codex/AGENTS.md`

### 卸载 / 重装

```bash
./scripts/install.sh --uninstall   # 移除 marketplace 和全部插件
./scripts/install.sh --reinstall   # 先卸载再重新安装
```

## 仓库结构

- `MEMORY.md`：Claude Code + Codex 共享的全局记忆单一事实源（安装脚本会创建全局链接）。
- `hooks/dispatch.mjs`：根级统一 hook dispatcher，跨所有 plugin 聚合执行；由安装脚本注入到 `~/.claude/settings.json` 与 `~/.codex/hooks.json`。
- `plugins/<plugin-name>/`：单个插件目录。安装走「逐 skill / 逐 agent symlink + 统一 hook dispatcher」，不依赖 marketplace manifest（`.codex-plugin/` 与 `.claude-plugin/` 均已移除，避免 codex 沿 symlink 真实路径推断 plugin namespace）。
- `plugins/<plugin-name>/README.md`：插件用途、skills、验证命令。
- `plugins/<plugin-name>/hooks/`：可选；插件内 hook 模块。统一 dispatcher 在每个事件下扫描所有 plugin 的 `hooks/<event>/*.mjs` 并依次执行。
- `plugins/<plugin-name>/agents/`：可选；只读分析或专用执行 agent（仅 Claude Code）。
- `AGENTS.md`：Codex CLI 项目指令文件，从 `CLAUDE.md` 自动生成。

## 插件总览

当前 marketplace 收录 55 个插件，按领域大致分为以下几类。

### 工程工作流

[architecture-expert](plugins/architecture-expert/README.md), [coding-expert](plugins/coding-expert/README.md), [debug-expert](plugins/debug-expert/README.md), [docs-expert](plugins/docs-expert/README.md), [git-expert](plugins/git-expert/README.md), [research-expert](plugins/research-expert/README.md), [skill-expert](plugins/skill-expert/README.md), [speckit-expert](plugins/speckit-expert/README.md), [svn-expert](plugins/svn-expert/README.md), [testing-expert](plugins/testing-expert/README.md), [thinking-expert](plugins/thinking-expert/README.md)

### 前端、客户端与体验

[android-expert](plugins/android-expert/README.md), [creative-expert](plugins/creative-expert/README.md), [frontend-expert](plugins/frontend-expert/README.md), [godot-expert](plugins/godot-expert/README.md), [ios-expert](plugins/ios-expert/README.md), [miniprogram-expert](plugins/miniprogram-expert/README.md), [nextjs-expert](plugins/nextjs-expert/README.md), [react-expert](plugins/react-expert/README.md), [tauri-expert](plugins/tauri-expert/README.md), [ux-expert](plugins/ux-expert/README.md), [vue-expert](plugins/vue-expert/README.md), [youtube-expert](plugins/youtube-expert/README.md)

### 语言与后端框架

[cpp-expert](plugins/cpp-expert/README.md), [go-expert](plugins/go-expert/README.md), [java-expert](plugins/java-expert/README.md), [javascript-expert](plugins/javascript-expert/README.md), [laravel-expert](plugins/laravel-expert/README.md), [nestjs-expert](plugins/nestjs-expert/README.md), [php-expert](plugins/php-expert/README.md), [python-expert](plugins/python-expert/README.md), [ruby-expert](plugins/ruby-expert/README.md), [rust-expert](plugins/rust-expert/README.md), [symfony-expert](plugins/symfony-expert/README.md), [typescript-expert](plugins/typescript-expert/README.md), [webman-expert](plugins/webman-expert/README.md)

### 基础设施、数据与安全

[data-ai-expert](plugins/data-ai-expert/README.md), [database-expert](plugins/database-expert/README.md), [devops-expert](plugins/devops-expert/README.md), [linux-expert](plugins/linux-expert/README.md), [microsoft-expert](plugins/microsoft-expert/README.md), [mysql-expert](plugins/mysql-expert/README.md), [pgsql-expert](plugins/pgsql-expert/README.md), [redis-expert](plugins/redis-expert/README.md), [security-expert](plugins/security-expert/README.md), [windows-expert](plugins/windows-expert/README.md)

### 产品、业务与内容

[finance-expert](plugins/finance-expert/README.md), [legal-expert](plugins/legal-expert/README.md), [marketing-expert](plugins/marketing-expert/README.md), [meeting-expert](plugins/meeting-expert/README.md), [obsidian-expert](plugins/obsidian-expert/README.md), [product-expert](plugins/product-expert/README.md), [social-media-expert](plugins/social-media-expert/README.md)

## 推荐使用方式

- 需要通用代码守卫时，先装 [coding-expert](plugins/coding-expert/README.md)，跨语言调试语句检测和文件预算守卫也统一由它提供，再叠加对应语言插件。
- 涉及提交、分支、staged diff、工作区纪律时，优先装 [git-expert](plugins/git-expert/README.md)。
- 写技术文档、提案、Markdown/Mermaid、PDF/Office 文档时，优先装 [docs-expert](plugins/docs-expert/README.md)。
- 做测试策略、预落地检查和 Web 测试时，优先装 [testing-expert](plugins/testing-expert/README.md)。
- 做产品、营销、内容或社媒工作时，直接看对应领域插件 README，而不是从 skills 目录盲找。

## 内容质量治理

本仓库的核心内容是插件 README、`SKILL.md`、参考资料、脚本和 eval。改这些内容时，不追求“写得更多”，优先追求可触发、可执行、可验证。

维护 skill 内容时按下面顺序收敛：

1. **先定来源**：列出本次改动依据的源材料，例如官方文档、源码、真实失败案例、telemetry、用户反馈。没有来源的经验判断要标注为推断。
2. **再定验收**：明确这次改动要让 agent 多做什么、少做什么。能脚本验证就补脚本，不能脚本验证就补正反 eval 或压力场景。
3. **只改可执行规则**：`SKILL.md` 放触发后必须立即执行的心智模型、流程和红线；大段背景、示例和素材放 `references/`、`scripts/` 或 `assets/`。
4. **防合理化**：对容易被 agent 跳过的规则，用 Red Flags / Rationalizations 表写清“危险念头”和“现实后果”。
5. **做对照验证**：重要 skill 变更优先用 [skill-creator](plugins/skill-expert/skills/skill-creator/SKILL.md) 跑 with-skill vs baseline；源材料很厚时，用 [skill-verifier](plugins/skill-expert/skills/skill-verifier/SKILL.md) 做闭卷覆盖验证。

仓库级质量用 `node scripts/skill-quality-report.mjs --json` 看结构、description、eval 覆盖、触发域冲突和已落盘的 with-skill vs baseline 效果评测；尚未覆盖的真实效果仍要看 eval 输出、压力场景、telemetry 和人工复盘。

## 维护与验证

安装/重装：`./scripts/install.sh --reinstall`（解链 → 清理旧 marketplace 残留 → 重新 symlink skills/agents + 写入统一 hooks）。

跑插件回归测试：

```bash
# 单个插件
node --test plugins/<plugin>/tests/*.test.mjs

# 全仓
find plugins -name '*.test.mjs' -print0 | xargs -0 node --test
```

更新具体插件后，继续进入对应插件目录或直接运行其 README 中列出的验证命令。仓库根 README 只负责入口说明；插件行为、hooks 与依赖以各插件 README 为准。

## 触发审计

仓库提供两层审计入口：

```bash
# hooks + skills 总览：静态覆盖、运行时 hook 遥测、skill eval 覆盖
node scripts/trigger-audit-report.mjs --days 30
node scripts/trigger-audit-report.mjs --session latest --days 7

# skill 质量总览：结构、description、eval 覆盖、触发域重叠
node scripts/skill-quality-report.mjs --json
node scripts/skill-quality-report.mjs --plugin skill-expert

# hook runtime 细节：按插件/hook 统计 block/report/context/error/skip/audit
node scripts/hook-telemetry-report.mjs --days 30
node scripts/hook-telemetry-report.mjs --all-workspaces --days 30
node scripts/hook-telemetry-report.mjs --session latest --days 7

# 需要降低日志噪音时，可关闭 skip 记录
AI_EXPERTS_HOOK_AUDIT=0 <your claude-or-codex command>
```

Hook 运行时按工作区路径分桶写入 `~/.claude/hook-telemetry/workspaces/<hash>-<name>/decisions.jsonl`。默认自动记录 `block`、`report`、`context`、`error`、`skip` 和 skill 使用 `audit` 记录，并附带可用的 `session_id` / `transcript_path` 以支持 `--session latest` 分析；设置 `AI_EXPERTS_HOOK_AUDIT=0` 可关闭 `skip` 记录降噪。单桶默认最多保留 5 个文件、每个 5MB；可用 `AI_EXPERTS_HOOK_TELEMETRY_MAX_FILES` 和 `AI_EXPERTS_HOOK_TELEMETRY_MAX_BYTES` 调整。设置 `AI_EXPERTS_HOOK_TELEMETRY=0` 可关闭写入。

Skill 的原生激活由 Claude Code / Codex 的路由层完成，不会向插件暴露权威 runtime event。因此 skill 触发审计由两部分组成：`skill-expert` 的 Stop hook 自动记录每轮路由声明、已调用/未调用和下一步推荐；静态回归仍以 `skills/*/evals/cases.yaml` 为基准。每个重要 skill 至少提供正向触发样例和反向不触发样例，`trigger-audit-report.mjs` 会列出缺 eval、缺反例、description 触发域重叠和最近运行时路由纪律问题；`skill-quality-report.mjs` 则聚合结构、description、eval 覆盖和触发域重叠，但不声称真实任务效果分。

需要把 telemetry 统计转成可执行治理建议时，使用 `skill-expert:trigger-telemetry-advisor`。`skill-expert` 会基于最近自动审计到的 skill 路由/使用和 hook telemetry 信号，在合适时机通过 UserPromptSubmit 提醒使用该 skill，而不是依赖用户显式提到 telemetry 名称。

## 兼容性说明

| 功能 | Claude Code | Codex CLI |
|------|:-----------:|:---------:|
| Skills (SKILL.md) | ✅ | ✅ |
| Hooks | ✅ 插件内置 | ✅ 安装脚本生成用户级聚合 |
| Agents | ✅ | ❌ 不支持 |
| Plugin Manifest | 已移除（直接 symlink skills，避免 codex 沿 ancestor 推断 plugin namespace） | 同左 |
| 项目指令 | `CLAUDE.md` | `AGENTS.md`（自动生成） |
| Marketplace | 不再使用 | 不再使用 |

## 参考文档

- Claude Code plugin marketplaces: https://code.claude.com/docs/en/plugin-marketplaces
- Claude Code discover/install plugins: https://code.claude.com/docs/en/discover-plugins
- Codex CLI: https://github.com/openai/codex
