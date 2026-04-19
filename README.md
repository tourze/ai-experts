# ai-experts

一个同时兼容 **Claude Code** 和 **OpenAI Codex CLI** 的本地插件仓库与 marketplace，按领域提供 `*-expert` 插件集合。插件源码集中放在 `plugins/` 下；每个插件都包含自己的 manifest（`.claude-plugin/` + `.codex-plugin/` 双格式）、README、skills 与最小回归测试，并可按需提供 `hooks/` 与 `agents/`。

## 快速开始

前提：本机已安装 `claude` CLI 和/或 [Codex CLI](https://github.com/openai/codex)。

### 一键安装

脚本会自动检测已安装的 CLI 工具（Claude Code / Codex CLI），注册 marketplace 并启用全部插件：

```bash
./scripts/install.sh
```

### 卸载 / 重装

```bash
./scripts/install.sh --uninstall   # 移除 marketplace 和全部插件
./scripts/install.sh --reinstall   # 先卸载再重新安装
```

## 仓库结构

- `.claude-plugin/marketplace.json`：仓库级 Claude Code marketplace 清单。
- `.agents/plugins/marketplace.json`：仓库级 Codex CLI marketplace 清单（脚本生成，Codex 自动发现路径）。
- `.codex/hooks.json`：Codex CLI 项目级聚合 hooks（脚本生成）。
- `plugins/<plugin-name>/`：单个插件目录；每个插件同时包含 `.claude-plugin/plugin.json` 和 `.codex-plugin/plugin.json`。
- `plugins/<plugin-name>/README.md`：插件用途、skills、安装/卸载方式，以及适用时的 hooks、agents 与验证命令。
- `plugins/<plugin-name>/hooks/`：可选；插件级 hook 定义与分发入口（Claude Code 直接使用；Codex CLI 通过根目录聚合文件使用）。
- `plugins/<plugin-name>/agents/`：可选；只读分析或专用执行 agent（仅 Claude Code）。
- `AGENTS.md`：Codex CLI 项目指令文件，从 `CLAUDE.md` 自动生成。
- `memory/`：仓库本地 memory 与迁移中的规则草稿，不属于 marketplace 必需结构。

## 插件总览

当前 marketplace 收录 54 个插件，按领域大致分为以下几类。

### 工程工作流

[architecture-expert](plugins/architecture-expert/README.md), [coding-expert](plugins/coding-expert/README.md), [debug-expert](plugins/debug-expert/README.md), [docs-expert](plugins/docs-expert/README.md), [git-expert](plugins/git-expert/README.md), [research-expert](plugins/research-expert/README.md), [skill-expert](plugins/skill-expert/README.md), [svn-expert](plugins/svn-expert/README.md), [testing-expert](plugins/testing-expert/README.md), [thinking-expert](plugins/thinking-expert/README.md)

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

## 维护与验证

更新 marketplace 后，至少执行：

```bash
# Claude Code 元数据同步
node scripts/sync-plugin-metadata.mjs --write
jq empty .claude-plugin/marketplace.json
claude plugin validate .claude-plugin/marketplace.json
node --test tests/plugin-metadata-sync.test.mjs
node --test tests/marketplace-sync.test.mjs

# Codex CLI 元数据同步
node scripts/sync-codex-metadata.mjs --write
node scripts/generate-codex-hooks.mjs --write
```

更新具体插件后，继续进入对应插件目录或直接运行其 README 中列出的验证命令。仓库根 README 只负责入口说明；插件行为、hooks 与依赖以各插件 README 为准。

## 兼容性说明

| 功能 | Claude Code | Codex CLI |
|------|:-----------:|:---------:|
| Skills (SKILL.md) | ✅ | ✅ |
| Hooks | ✅ 插件内置 | ✅ 项目级聚合 |
| Agents | ✅ | ❌ 不支持 |
| Plugin Manifest | `.claude-plugin/` | `.codex-plugin/` |
| 项目指令 | `CLAUDE.md` | `AGENTS.md`（自动生成） |
| Marketplace | `.claude-plugin/marketplace.json` | `.agents/plugins/marketplace.json` |

## 参考文档

- Claude Code plugin marketplaces: https://code.claude.com/docs/en/plugin-marketplaces
- Claude Code discover/install plugins: https://code.claude.com/docs/en/discover-plugins
- Codex CLI: https://github.com/openai/codex
