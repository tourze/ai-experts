# AI Experts - Claude Code Plugin Collection

## 项目概述
Claude Code 插件集合，包含 54 个领域专家插件，每个插件提供 skills、hooks 和/或 agents。

## 核心架构约束
- **插件源码不能跨插件 import**：每个插件仍以独立目录分发；通用守卫统一收敛在基座插件中，通过 manifest dependencies 复用，不再在各插件里复制同一份实现。
- 插件结构：`.claude-plugin/plugin.json` + `README.md` + `skills/` + `tests/`，并可按需提供 `hooks/` 与 `agents/`

## 插件层次结构
插件按以下四层组织，上层依赖下层提供的 hooks 兜底，不重复实现已有守卫：

1. **通用基座层** — coding-expert
   - 提供所有文件类型通用的守卫：encoding、merge-conflict、debug-statement、file-budget、edit-loop、dangerous-command 等
   - 提供通用 UserPromptSubmit 引导：debug-methodology、over-engineering、investigation 等
   - 无语言/框架偏向，应最先安装

2. **工作流层** — git-expert, testing-expert, docs-expert
   - 跨语言的工作流守卫（git 纪律、测试策略、文档处理）
   - 与基座层和语言层正交，按需安装

3. **语言层** — python-expert, javascript-expert, typescript-expert, java-expert, go-expert, rust-expert, ruby-expert, php-expert, cpp-expert, ios-expert, perl-expert 等
   - 在基座层之上叠加语言特有的 syntax check、lint 与必要的特化守卫
   - 各自包含自己的 dispatch.mjs 和语言特有的 PostToolUse 守卫；通用 `file-budget` 与跨语言 `debug-statement` 统一复用 `coding-expert`，特化版 debug-statement 仍保留在对应插件

4. **框架/领域层** — react-expert, nextjs-expert, laravel-expert, nestjs-expert, vue-expert, devops-expert, frontend-expert, security-expert, product-expert, marketing-expert 等
   - 主要提供 skills，少数有领域特有的 hooks
   - 框架/领域插件按需通过 dependencies 声明依赖对应的语言插件或 `coding-expert`
   - 非代码领域插件（product/marketing/legal/finance 等）只提供 skills，不需要文件守卫

## 已声明的插件依赖
- android-expert → java-expert
- cpp-expert → coding-expert
- devops-expert → coding-expert, linux-expert
- frontend-expert → javascript-expert
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

- **Skill = 知识**（inline context）：方法论、检查清单、模板、领域约定。触发后注入当前对话，不隔离上下文。
- **Agent = 执行者**（isolated context）：在独立 context window 中运行，只返回摘要。适合产生大量中间输出的任务。

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
- 测试：每个插件含 tests/ 目录

## Hook 事件类型
SessionStart, PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop

## Git 工作流
- 主分支：main
- 提交风格：conventional commits（feat/fix/refactor/chore）
