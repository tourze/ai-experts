# ai-experts

一个同时兼容 **Claude Code** 和 **OpenAI Codex CLI** 的本地插件仓库，按领域提供 `*-expert` 插件集合，包含 55 个领域专家插件，每个插件提供 skills、hooks、agents 和/或 MCP 声明。安装脚本将 `plugins/<plugin>/skills/<skill>` 直接软链到 `~/.claude/skills/` 与 `~/.codex/skills/`，把 agents 链到 `~/.claude/agents/`，把插件 MCP 同步到两端用户级配置，并把统一 hook dispatcher 注入两端的 settings/hooks 配置（不再依赖 marketplace plugin 安装）。每个插件包含自己的 README、skills 与最小回归测试，并可按需提供 `hooks/`、`agents/` 与 `.mcp.json`。

当前规模：55 个插件、502 个 skill、76 个 agent、120 个 hook 模块。

> 本文件同时承担三种角色 —— 仓库入口 README、Claude Code 项目指令 `CLAUDE.md`、Codex CLI 项目指令 `AGENTS.md`。仓库根的 `CLAUDE.md` 与 `AGENTS.md` 都是指向本文件的 symlink，维护一份即可，不再有"AGENTS.md 由 CLAUDE.md 手动同步"的双轨。

## 术语约定（记忆文件）

- `MEMORY.md`、`CLAUDE.md`、`AGENTS.md` 均属于"记忆文件"。
- 在插件文案、hook 提示和 skill 指引里默认使用"记忆文件"统称，避免按平台文件名耦合表达。
- 只有在需要给出具体路径或执行文件级操作时，才写具体文件名。

## 核心架构约束

- **插件源码不能跨插件 import**：每个插件仍以独立目录分发；通用守卫统一收敛在基座插件中，通过 README "已声明的插件依赖" 段落 + `tests/dependency-graph.test.mjs` 强校验复用关系（marketplace manifest 体系已废弃，dependency-graph 测试同时禁止已声明依赖 `coding-expert` 的插件复刻基座 guard，仅 `debug-statement-guard.mjs` 因语言特化版需求保留例外）。
- 插件结构：`README.md` + `skills/`，并可按需提供 `hooks/` / `agents/` / `tests/` / `.mcp.json`（marketplace 体系已废弃，不再使用 `.claude-plugin/`/`.codex-plugin/` manifest）。
- **不生成仓库级 `.codex/hooks.json`**：Codex CLI 的统一 hooks 由 `scripts/sync-hooks.mjs` 写入用户级 `${CODEX_HOME:-~/.codex}/hooks.json`，每条命令指向根级 `hooks/dispatch.mjs` 跨插件分发。

## 插件层次结构

插件按以下四层组织，上层依赖下层提供的 hooks 兜底，不重复实现已有守卫：

1. **通用基座层** — coding-expert
   - 提供所有文件类型通用的守卫：encoding、merge-conflict、debug-statement、file-budget、edit-loop、dangerous-command 等
   - 提供通用 UserPromptSubmit 引导：debug-methodology、over-engineering、investigation 等
   - 无语言/框架偏向，应最先安装

2. **工作流层** — git-expert, testing-expert, docs-expert
   - 跨语言的工作流守卫（git 纪律、测试策略、文档处理）
   - 与基座层和语言层正交，按需安装

3. **语言层** — python-expert, javascript-expert, typescript-expert, java-expert, go-expert, rust-expert, ruby-expert, php-expert, cpp-expert, perl-expert，以及以语言为入口的客户端 surface（android-expert / ios-expert）
   - 在基座层之上叠加语言特有的 syntax check、lint 与必要的特化守卫
   - 仅根 `hooks/dispatch.mjs` 一个 dispatcher，本层 hooks 通过 `hooks/<event>/<sub>/*.mjs` 被根 dispatcher 自动发现，无需自带 dispatch
   - 通用 `file-budget` 与跨语言 `debug-statement` 统一复用 `coding-expert`，仅 `debug-statement-guard.mjs` 因语言语义差异保留各自特化版

4. **框架/领域层** — react-expert, nextjs-expert, laravel-expert, nestjs-expert, vue-expert, devops-expert, frontend-expert, security-expert, product-expert, marketing-expert 等
   - 主要提供 skills，少数有领域特有的 hooks
   - 框架/领域插件按需通过 README "已声明的插件依赖" 段声明依赖对应的语言插件或 `coding-expert`
   - 非代码领域插件（product/marketing/legal/finance 等）只提供 skills，不需要文件守卫

## 已声明的插件依赖

- android-expert → java-expert
- cpp-expert → coding-expert
- devops-expert → coding-expert, linux-expert
- frontend-expert → javascript-expert, react-expert
- go-expert → coding-expert
- ios-expert → coding-expert
- java-expert → coding-expert
- javascript-expert → coding-expert
- laravel-expert → php-expert
- linux-expert → coding-expert
- mysql-expert → database-expert
- nestjs-expert → typescript-expert
- nextjs-expert → typescript-expert, react-expert
- perl-expert → coding-expert
- pgsql-expert → database-expert
- php-expert → coding-expert
- python-expert → coding-expert
- react-native-expert → react-expert
- redis-expert → database-expert
- ruby-expert → coding-expert
- rust-expert → coding-expert
- symfony-expert → php-expert
- tauri-expert → rust-expert, typescript-expert
- typescript-expert → coding-expert
- vue-expert → javascript-expert
- webman-expert → php-expert

## Agent 设计原则

插件通过 `agents/` 目录提供子代理，与 `skills/` 形成互补关系：

- **Skill = 知识**（inline context）：方法论、检查清单、模板、领域约定。触发后注入当前对话，不隔离上下文。由 CLI 路由层根据 description 命中后注入当前对话上下文。
- **Agent = 执行者**（isolated context）：在独立 context window 中运行 review / 编排任务，只回主对话摘要。适合产生大量中间输出的任务。Codex CLI 暂不支持，agent 仅在 Claude Code 端生效。

### Agent 两种模式

| | Reviewer Agent | Orchestration Agent |
|--|---------------|---------------------|
| tools | 只读：Read, Grep, Glob, Bash | 含 Write, WebSearch, WebFetch |
| skills 字段 | 无（通过「关联 Skill」引用） | 预加载 8-11 个 skill 到上下文 |
| 用途 | 代码/配置/文档审查 | 多框架综合分析，产出报告/PRD |
| 文件修改 | 不修改任何文件 | 可写报告/文档 |

### 何时需要 Agent

- 任务会产生 > 5000 token 的中间结果（git log、仓库扫描、数据分析）
- 需要限制工具集（只读审计、不能写文件）
- 多个 skill 需要同时参与分析（编排型）

### Skill → Agent 路由

重 I/O 的 skill 通过 frontmatter `context: fork` + `agent: <agent-name>` 自动在子代理中执行，避免模型猜测执行方式。

### 不需要 Agent 的插件

纯知识/方法论插件（legal、finance、meeting 等）skill 数少且不产生重 I/O，保持 inline context 即可。

## 技术栈

- Hook 实现：Node.js ESM (.mjs)
- Hook 协议：stdin/stdout JSON，dispatch.mjs 动态发现子目录下的 .mjs 文件
- 测试：建议每个插件提供 tests/ 目录；纯 skills 插件可缺省，由仓库级 `tests/` 兜底回归（参考 `CONTRIBUTING.md`）

## Hook 事件类型

SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop

## Git 工作流

- 主分支：master
- 提交风格：conventional commits（feat/fix/refactor/chore）

## 快速开始

前提：本机已安装 `claude` CLI 和/或 [Codex CLI](https://github.com/openai/codex)。

### 一键安装

脚本会自动检测已安装的 CLI 工具（Claude Code / Codex CLI），symlink 全部 skills/agents 并把根 dispatcher 注入用户级 hooks 配置：

```bash
node scripts/install.mjs
```

安装时还会把仓库根目录的 [`MEMORY.md`](MEMORY.md) 链接到全局记忆文件：
- Claude Code: `~/.claude/CLAUDE.md`
- Codex CLI: `~/.codex/AGENTS.md`

### 插件 MCP 自动配置

安装脚本会扫描各插件目录下的 `.mcp.json`，并把其中声明的 MCP 服务同步到 Claude Code 与 Codex CLI。当前 `data-ai-expert` 声明了智谱 Z.AI 的视觉、搜索、网页读取和开源仓库读取 MCP；如需启用，先复制模板并填入本地 key：

```bash
cp .env.example .env.local
# 编辑 .env.local，填写 Z_AI_API_KEY
node scripts/install.mjs
```

`install` / `reinstall` 会读取 `.env.local` 的 `Z_AI_API_KEY`。存在 key 时，会为 Claude Code 与 Codex CLI 同步以下托管 MCP 服务：
- `zai-mcp-server`：视觉理解，本地 stdio server，使用 `npx -y @z_ai/mcp-server`
- `web-search-prime`：联网搜索，远程 HTTP MCP
- `web-reader`：网页读取，远程 HTTP MCP
- `zread`：开源仓库读取，远程 HTTP MCP

未配置 `Z_AI_API_KEY` 时，安装脚本会移除依赖该变量的托管 MCP 条目，并保留用户自己配置的其他 MCP 服务。真实 `.env.local` 已被 `.gitignore` 忽略，不应提交。

### 卸载 / 重装

```bash
node scripts/install.mjs --uninstall   # 解链全部 skills/agents、移除注入的 hooks 条目
node scripts/install.mjs --reinstall   # 先卸载再重新安装
node scripts/install.mjs --dry-run     # 仅打印计划动作，不改动磁盘
```

## 仓库结构

- `README.md`：仓库入口与项目指令；仓库根 `CLAUDE.md` 与 `AGENTS.md` 均为指向本文件的 symlink，维护一份即可。
- `MEMORY.md`：Claude Code + Codex 共享的全局记忆单一事实源（安装脚本会创建全局链接）。
- `.env.example`：智谱 MCP 本地环境变量模板；复制为 `.env.local` 后填入 `Z_AI_API_KEY`。
- `hooks/dispatch.mjs`：根级统一 hook dispatcher，跨所有 plugin 聚合执行；由安装脚本注入到 `~/.claude/settings.json` 与 `~/.codex/hooks.json`。
- `plugins/<plugin-name>/`：单个插件目录。安装走「逐 skill / 逐 agent symlink + 插件 MCP 同步 + 统一 hook dispatcher」，不依赖 marketplace manifest（`.codex-plugin/` 与 `.claude-plugin/` 均已移除，避免 codex 沿 symlink 真实路径推断 plugin namespace）。
- `plugins/<plugin-name>/README.md`：插件用途、skills、验证命令。
- `plugins/<plugin-name>/hooks/`：可选；插件内 hook 模块。统一 dispatcher 在每个事件下扫描所有 plugin 的 `hooks/<event>/*.mjs` 并依次执行。
- `plugins/<plugin-name>/agents/`：可选；只读分析或专用执行 agent（仅 Claude Code）。
- `scripts/`：安装脚本与质量审计脚本（sync-skills、sync-hooks、sync-agents、sync-mcp、skill-quality-report、trigger-audit-report、audit-skill-evals 等）。
- `tests/`：仓库级回归测试（install.mjs、生成器、报告器、跨插件一致性）。

## 插件总览

55 个插件按领域大致分为以下几类。

### 工程工作流

[architecture-expert](plugins/architecture-expert/README.md), [coding-expert](plugins/coding-expert/README.md), [debug-expert](plugins/debug-expert/README.md), [docs-expert](plugins/docs-expert/README.md), [git-expert](plugins/git-expert/README.md), [research-expert](plugins/research-expert/README.md), [skill-expert](plugins/skill-expert/README.md), [speckit-expert](plugins/speckit-expert/README.md), [svn-expert](plugins/svn-expert/README.md), [testing-expert](plugins/testing-expert/README.md), [thinking-expert](plugins/thinking-expert/README.md)

### 前端、客户端与体验

[android-expert](plugins/android-expert/README.md), [creative-expert](plugins/creative-expert/README.md), [frontend-expert](plugins/frontend-expert/README.md), [godot-expert](plugins/godot-expert/README.md), [ios-expert](plugins/ios-expert/README.md), [miniprogram-expert](plugins/miniprogram-expert/README.md), [nextjs-expert](plugins/nextjs-expert/README.md), [react-expert](plugins/react-expert/README.md), [react-native-expert](plugins/react-native-expert/README.md), [tauri-expert](plugins/tauri-expert/README.md), [ux-expert](plugins/ux-expert/README.md), [vue-expert](plugins/vue-expert/README.md), [youtube-expert](plugins/youtube-expert/README.md)

### 语言与后端框架

[cpp-expert](plugins/cpp-expert/README.md), [go-expert](plugins/go-expert/README.md), [java-expert](plugins/java-expert/README.md), [javascript-expert](plugins/javascript-expert/README.md), [laravel-expert](plugins/laravel-expert/README.md), [nestjs-expert](plugins/nestjs-expert/README.md), [perl-expert](plugins/perl-expert/README.md), [php-expert](plugins/php-expert/README.md), [python-expert](plugins/python-expert/README.md), [ruby-expert](plugins/ruby-expert/README.md), [rust-expert](plugins/rust-expert/README.md), [symfony-expert](plugins/symfony-expert/README.md), [typescript-expert](plugins/typescript-expert/README.md), [webman-expert](plugins/webman-expert/README.md)

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

### 高频工程闭环

日常工程任务优先按下面闭环推进；不必每次从第一步开始，按当前任务阶段切入即可。

```
压实意图 → 固化需求 → 拆解任务 → 实现落地 → 调试修复 → 测试验证 → 落地审查 → 会话复盘
```

| 阶段 | 首选 skill | 何时使用 |
|------|------------|----------|
| 压实意图 | [`grill-me`](plugins/thinking-expert/skills/grill-me/SKILL.md) | 方案、设计或需求仍有关键假设未确认时，一次一问压实决策树 |
| 固化需求 | [`create-prd`](plugins/product-expert/skills/create-prd/SKILL.md) | 需要把上下文整理成可评审、可拆任务、可验收的 PRD 时 |
| 拆解任务 | [`task-decomposer`](plugins/architecture-expert/skills/task-decomposer/SKILL.md) | 需要任务板、依赖关系、关键路径、并行边界或 Execution Contract 时 |
| 实现落地 | [`feature-dev`](plugins/architecture-expert/skills/feature-dev/SKILL.md) | 跨文件、跨模块或存在架构取舍的新功能实现 |
| 调试修复 | [`debug-methodology`](plugins/coding-expert/skills/debug-methodology/SKILL.md) | 遇到 bug、崩溃、flaky、性能回退或无法复现的问题 |
| 测试验证 | [`test-driven-development`](plugins/testing-expert/skills/test-driven-development/SKILL.md) / [`testing-strategy`](plugins/testing-expert/skills/testing-strategy/SKILL.md) | 需要红绿重构、补回归测试或设计风险驱动测试计划时 |
| 落地审查 | [`pre-landing-review`](plugins/testing-expert/skills/pre-landing-review/SKILL.md) | 合并或上线前判断 diff 是否存在阻断级风险 |
| 会话复盘 | [`session-reflection`](plugins/skill-expert/skills/session-reflection/SKILL.md) | 任务闭合后总结完成情况、未验证项、风险和可沉淀的治理建议 |

## 内容质量治理

本仓库的核心内容是插件 README、`SKILL.md`、参考资料、脚本和 eval。改这些内容时，不追求"写得更多"，优先追求可触发、可执行、可验证。

维护 skill 内容时按下面顺序收敛：

1. **先定来源**：列出本次改动依据的源材料，例如官方文档、源码、真实失败案例、telemetry、用户反馈。没有来源的经验判断要标注为推断。
2. **再定验收**：明确这次改动要让 agent 多做什么、少做什么。能脚本验证就补脚本，不能脚本验证就补正反 eval 或压力场景。
3. **只改可执行规则**：`SKILL.md` 放触发后必须立即执行的心智模型、流程和红线；大段背景、示例和素材放 `references/`、`scripts/` 或 `assets/`。
4. **防合理化**：对容易被 agent 跳过的规则，用 Red Flags / Rationalizations 表写清"危险念头"和"现实后果"。
5. **做对照验证**：重要 skill 变更优先用 [skill-creator](plugins/skill-expert/skills/skill-creator/SKILL.md) 跑 with-skill vs baseline；源材料很厚时，用 [skill-verifier](plugins/skill-expert/skills/skill-verifier/SKILL.md) 做闭卷覆盖验证。

仓库级质量用 `node scripts/skill-quality-report.mjs --json` 看结构、description、eval 覆盖、触发域冲突和已落盘的 with-skill vs baseline 效果评测；尚未覆盖的真实效果仍要看 eval 输出、压力场景、telemetry 和人工复盘。当前自动化分约 95 / 100，eval 覆盖 100%，CSO（description 触发域审计）通过 100%。

### 自运行治理模型

维护 skill / agent / hooks 时，优先判断缺口属于哪一类机制，不要把所有问题都归结为“再写一个 skill”：

| 机制 | 本仓库落点 | 优先信号 |
|------|------------|----------|
| 自组织 | 插件目录、已声明依赖、README、`evals/cases.yaml` | 新内容能否独立安装、独立触发、独立验证 |
| 自激励 | `skill-quality-report.mjs`、with-skill vs baseline、运行时 telemetry | 高频使用 skill 是否有真实效果评测；报告是否把下一步修复对象排清楚 |
| 自约束 | PreToolUse / PostToolUse / Stop hooks、仓库级 tests | 安全和正确性问题是否在责任层 fail-fast；hook 是否误拦或噪音过高 |
| 自协同 | 根 `hooks/dispatch.mjs`、跨插件依赖、编排型 agents | 通用守卫是否收敛到基座；agent 是否复用既有 skill 而不是复制流程 |

触发审计中，`block` / `report` / `context` / `error` 是可行动热点；`skip` 只表示覆盖范围和运行成本。治理顺序先处理错误与误拦，再处理高频噪音，最后扩展效果评测样本。

## 维护与验证

安装/重装：`node scripts/install.mjs --reinstall`（解链 → 清理旧 marketplace 残留 → 重新 symlink skills/agents + 写入统一 hooks）。

跑回归测试：

```bash
# 单个插件
node --test plugins/<plugin>/tests/*.test.mjs

# 全部插件
find plugins -name '*.test.mjs' -print0 | xargs -0 node --test

# 仓库级测试（install.mjs、生成器、报告器、跨插件一致性）
node --test tests/*.test.mjs
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
| Hooks | ✅ 用户级 settings.json 注入根 dispatcher | ✅ 用户级 hooks.json 注入根 dispatcher |
| Agents | ✅ | ❌ 不支持 |
| Plugin Manifest | 已移除（直接 symlink skills，避免 codex 沿 ancestor 推断 plugin namespace） | 同左 |
| 项目指令 | `CLAUDE.md` → `README.md`（symlink） | `AGENTS.md` → `README.md`（symlink） |
| Marketplace | 不再使用 | 不再使用 |

## 参考文档

- Claude Code plugin marketplaces: https://code.claude.com/docs/en/plugin-marketplaces
- Claude Code discover/install plugins: https://code.claude.com/docs/en/discover-plugins
- Codex CLI: https://github.com/openai/codex
