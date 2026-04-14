---
name: obsidian-cli
description: 使用 Obsidian CLI 与正在运行的 Obsidian 应用交互，适用于读写笔记、搜索 vault、处理 daily notes / tasks / properties / tags / backlinks、查询 Bases，以及调试社区插件或主题。触发词包括 Obsidian CLI、vault、daily、property:set、tasks、tags、backlinks、plugin:reload、dev:screenshot、dev:dom。
---

# Obsidian CLI

## 适用场景

- 用户要用 `obsidian` 命令读写、搜索或批量处理 Vault 中的笔记。
- 用户要操作 daily note、任务、属性、标签、反向链接或文件历史。
- 用户要从命令行查询 `.base` 文件、列出视图或在 Base 中创建条目。
- 用户在开发或调试 Obsidian 社区插件 / 主题，需要 `plugin:reload`、`dev:*`、`eval` 一类开发命令。
- 如果用户要直接编辑 `.base` YAML 结构，优先配合 [obsidian-bases](../obsidian-bases/SKILL.md)。

## 核心约束

- 使用前提是已安装并注册 Obsidian CLI；官方帮助页要求使用 Obsidian 1.12 安装器，安装步骤要求 1.12.7+，并且执行命令时 Obsidian 应用需可用。
- `vault=<name>` 或 `vault=<id>` 必须放在命令最前面，例如 `obsidian vault=Notes daily`。
- `file=<name>` 走 wikilink 式解析；`path=<path>` 必须是相对 Vault 根目录的精确路径。
- 大多数命令在未传 `file` / `path` 时默认作用于当前活动文件，不要盲目假设一定需要目标文件参数。
- 参数使用 `name=value` 形式；布尔开关是裸 flag，例如 `open`、`overwrite`、`counts`、`total`。不要臆造文档里没有的 flag，例如 `silent`。
- 命令集合会持续演进；拿不准子命令或参数时，先运行 `obsidian help` 或 `obsidian help <command>`，不要凭记忆猜。

## 代码模式

### 1. 常见笔记与搜索操作

```bash
obsidian read file=Recipe
obsidian create name="Trip to Paris" template=Travel open
obsidian append file="Project Log" content="## Update\n- shipped"
obsidian search query="meeting notes" limit=10
obsidian search:context query="error budget" path="Projects"
```

### 2. Daily / 任务 / 属性 / 标签 / 反链

```bash
obsidian daily
obsidian daily:append content="- [ ] Buy groceries"
obsidian tasks daily todo
obsidian property:set file="Project Log" name=status value=done type=text
obsidian tags counts sort=count
obsidian backlinks file="Project Log" counts
```

### 3. Bases 相关命令

```bash
obsidian bases
obsidian base:views path="Views/Reading.base"
obsidian base:query path="Views/Reading.base" view="Books" format=json
obsidian base:create path="Views/Reading.base" view="Books" name="New entry" open
```

### 4. 插件 / 主题调试循环

```bash
obsidian plugin:reload id=my-plugin
obsidian dev:errors
obsidian dev:screenshot path=screenshot.png
obsidian dev:dom selector=".workspace-leaf" text
obsidian dev:console level=error
obsidian dev:css selector=".workspace-leaf" prop=background-color
obsidian eval code="app.vault.getFiles().length"
```

## 检查清单

- 本机是否已能执行 `obsidian help`，而不是只装了桌面应用没注册 CLI。
- 目标 Vault 是否明确；跨 Vault 操作时是否把 `vault=` 放在最前面。
- 当前场景该用 `file=` 还是 `path=`，有没有把“文件名解析”和“精确路径”混用。
- 命令里是否只用了官方存在的参数和 flag，没有继续沿用 `silent` 一类过期写法。
- `property:set` 是否同时提供了 `name=` 与 `value=`，必要时补 `type=`。
- 开发命令是否只在用户确实要调试插件 / 主题时使用，而不是误用到普通笔记场景。

## 反模式

- 把 `vault=` 放在子命令后面，例如 `obsidian daily vault=Notes`。
- 把 `file=` 当成路径参数使用，或给 `path=` 传不完整路径。
- 继续写 `silent` 这类官方 CLI 中不存在的 flag。
- 没有目标文件时强行传 `file=`，忽略“默认作用于活动文件”的行为。
- 用户只是要改 `.base` 结构，却还在 CLI 命令层兜圈子，不切到 [obsidian-bases](../obsidian-bases/SKILL.md)。
