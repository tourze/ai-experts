# ai-experts

一个面向 Claude Code 的本地插件仓库与 marketplace，按领域提供 `*-expert` 插件集合。当前仓库已经在根目录声明了 Claude marketplace，插件源码集中放在 `plugins/` 下，每个插件自带自己的 manifest、README、skills、hooks 与最小回归测试。

## 快速开始

前提：本机已安装 `claude` CLI。

1. 注册本地 marketplace

```bash
claude plugin marketplace add "$(pwd)" --scope user
```

如果只想在当前项目范围内声明 marketplace：

```bash
claude plugin marketplace add "$(pwd)" --scope project
```

2. 校验 marketplace 已被识别

```bash
claude plugin marketplace list
claude plugin validate .claude-plugin/marketplace.json
```

3. 安装具体插件

```bash
claude plugin install docs-expert@ai-experts
claude plugin install git-expert@ai-experts --scope project
```

4. 激活新插件

在 Claude Code 中执行：

```text
/reload-plugins
```

或者直接重启 Claude Code 会话。

## 仓库结构

- `.claude-plugin/marketplace.json`：仓库级 Claude plugin marketplace 清单。
- `plugins/<plugin-name>/`：单个插件目录；每个插件都有自己的 `.claude-plugin/plugin.json`。
- `plugins/<plugin-name>/README.md`：插件用途、skills、hooks 与验证方式。
- `memory/`：仓库本地 memory 与迁移中的规则草稿，不属于 marketplace 必需结构。

## 插件总览

当前 marketplace 收录 49 个插件，按领域大致分为以下几类。

### 工程工作流

[architecture-expert](plugins/architecture-expert/README.md), [coding-expert](plugins/coding-expert/README.md), [debug-expert](plugins/debug-expert/README.md), [docs-expert](plugins/docs-expert/README.md), [git-expert](plugins/git-expert/README.md), [research-expert](plugins/research-expert/README.md), [skill-expert](plugins/skill-expert/README.md), [svn-expert](plugins/svn-expert/README.md), [testing-expert](plugins/testing-expert/README.md), [thinking-expert](plugins/thinking-expert/README.md)

### 前端、客户端与体验

[android-expert](plugins/android-expert/README.md), [creative-expert](plugins/creative-expert/README.md), [frontend-expert](plugins/frontend-expert/README.md), [godot-expert](plugins/godot-expert/README.md), [miniprogram-expert](plugins/miniprogram-expert/README.md), [nextjs-expert](plugins/nextjs-expert/README.md), [react-expert](plugins/react-expert/README.md), [swift-expert](plugins/swift-expert/README.md), [tauri-expert](plugins/tauri-expert/README.md), [ux-expert](plugins/ux-expert/README.md), [vue-expert](plugins/vue-expert/README.md), [youtube-expert](plugins/youtube-expert/README.md)

### 语言与后端框架

[cpp-expert](plugins/cpp-expert/README.md), [go-expert](plugins/go-expert/README.md), [java-expert](plugins/java-expert/README.md), [javascript-expert](plugins/javascript-expert/README.md), [laravel-expert](plugins/laravel-expert/README.md), [nestjs-expert](plugins/nestjs-expert/README.md), [php-expert](plugins/php-expert/README.md), [python-expert](plugins/python-expert/README.md), [ruby-expert](plugins/ruby-expert/README.md), [rust-expert](plugins/rust-expert/README.md), [symfony-expert](plugins/symfony-expert/README.md), [typescript-expert](plugins/typescript-expert/README.md), [webman-expert](plugins/webman-expert/README.md)

### 基础设施、数据与安全

[data-ai-expert](plugins/data-ai-expert/README.md), [database-expert](plugins/database-expert/README.md), [devops-expert](plugins/devops-expert/README.md), [linux-expert](plugins/linux-expert/README.md), [microsoft-expert](plugins/microsoft-expert/README.md), [security-expert](plugins/security-expert/README.md), [windows-expert](plugins/windows-expert/README.md)

### 产品、业务与内容

[finance-expert](plugins/finance-expert/README.md), [legal-expert](plugins/legal-expert/README.md), [marketing-expert](plugins/marketing-expert/README.md), [meeting-expert](plugins/meeting-expert/README.md), [obsidian-expert](plugins/obsidian-expert/README.md), [product-expert](plugins/product-expert/README.md), [social-media-expert](plugins/social-media-expert/README.md)

## 推荐使用方式

- 需要通用代码守卫时，先装 [coding-expert](plugins/coding-expert/README.md)，再叠加对应语言插件。
- 涉及提交、分支、staged diff、工作区纪律时，优先装 [git-expert](plugins/git-expert/README.md)。
- 写技术文档、提案、Markdown/Mermaid、PDF/Office 文档时，优先装 [docs-expert](plugins/docs-expert/README.md)。
- 做测试策略、预落地检查和 Web 测试时，优先装 [testing-expert](plugins/testing-expert/README.md)。
- 做产品、营销、内容或社媒工作时，直接看对应领域插件 README，而不是从 skills 目录盲找。

## 维护与验证

更新 marketplace 后，至少执行：

```bash
jq empty .claude-plugin/marketplace.json
claude plugin validate .claude-plugin/marketplace.json
```

更新具体插件后，继续进入对应插件目录或直接运行其 README 中列出的验证命令。仓库根 README 只负责入口说明；插件行为、hooks 与依赖以各插件 README 为准。

## 参考文档

- Claude Code plugin marketplaces: https://code.claude.com/docs/en/plugin-marketplaces
- Claude Code discover/install plugins: https://code.claude.com/docs/en/discover-plugins
