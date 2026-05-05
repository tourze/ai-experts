# 贡献指南

感谢为 `ai-experts` 贡献代码。

## 开始之前

- Node.js 20 或更高版本
- 需要 `npm install`：组件构建链路使用开发态依赖编译 TypeScript skill scripts
- 新架构的事实源在 `src/components/`，构建输出在 `dist/claude/` 与 `dist/codex/`

## 本地校验

提交 PR 前请在仓库根跑：

```bash
npm run check:components
npm test
```

## 开发流程

1. 从 `master` 切焦点分支
2. 做最小可行改动
3. 当改动影响行为或 surface 时，新增/更新组件测试（例如 `tests/component-build.test.mjs` 或相邻测试文件）
4. 新增能力时：
   - Skill 放在 `src/components/skills/<skill>/`
   - Skill script 用 TypeScript 写，并通过 `defineSkillScript()` 登记
   - `body`、script `entry`、reference `source` 用 `new URL("./file", import.meta.url)` 指向邻近资源
   - Reference 放在组件源码或共享 reference 目录，并通过 `defineReference()` 登记；dist 层不跨 skill 直连
   - Agent 放在 `src/components/agents/<agent>/`，通过 `defineAgent()` 显式声明使用哪些 skill
   - Agent/profile 引用 skill 时 import skill definition 并读取 `.id`
   - Hook 通过统一 dispatcher 运行，不依赖 Claude/Codex 原生多 hook 顺序
5. 跑本地校验
6. 提 PR，按 `.github/PULL_REQUEST_TEMPLATE.md` 填写

## 新增 / 修改 hook 的安全审查清单

组件 hook 构建后会进入 `dist/<target>/hooks/dispatch.mjs`，在 Claude / Codex 触发对应事件时调用本仓库生成的 `.mjs` 文件，
等价于授予用户级本地代码执行能力。**合入新 hook = 增加 RCE 入口**，PR reviewer
必须显式确认下列每一项：

- [ ] 不发起任何外网请求（无 `fetch` / `http` / `https` / `net.connect` / `dns.lookup` / 子进程调用 `curl` `wget`）
- [ ] 不 `eval` / `Function()` 字符串，不 `import()` 用户输入拼出的路径
- [ ] 不写仓库目录与 `~/.claude` / `~/.codex` 之外的位置（telemetry / cache 必须用既有 `~/.claude/hook-telemetry/` 目录）
- [ ] 不读取敏感目录（`~/.ssh` / `~/.aws` / `~/.gnupg` / `~/.config/gh` / `/etc/shadow` 等）
- [ ] 不把 `tool_input.command` / `tool_input.file_path` 等 payload 直接拼接到 shell 字符串；调用外部命令必须用 `execFileSync` + 数组参数
- [ ] 任何 `execFileSync` / `execSync` 调用都设置了 `timeout`（建议 ≤ 5s 用于诊断 hook，≤ 10s 用于 syntax check）
- [ ] 所有用户级文件写入使用原子写（同目录 tmp + rename），不要覆盖用户自有配置
- [ ] 异常路径不会阻塞 dispatcher：`run()` 抛错由 dispatcher 兜底，但 hook 内部不应主动 `process.exit()`（除非该值为 dispatcher 协议返回值）
- [ ] 配套组件测试同时覆盖 Claude 与 Codex payload fixture，并覆盖 TP（应 block / report）与 TN（不应误拦）
- [ ] 若新 hook 与既有 hook 同名，需在 PR 描述给出语义差异理由，避免重复中间件造成双重阻断

## 范围约束（Scope Guidelines）

本仓库目标是**面向多 CLI 的 AI 能力组件集合**。可被接受的改动：

- `src/components/` 下的 skill / agent / hook / instruction 增改
- `dist/claude/` 与 `dist/codex/` 构建产物更新

不接受：

- dist 产物依赖跨 skill 运行时 import（skill 必须可独立迁移）
- 未登记的 skill script 或 reference
- 引入仓库级运行时 npm 依赖；构建依赖必须保持开发态
- 在 hooks 里写入用户 home 目录之外的全局位置
- "顺手"格式化或重构与本次改动无关的文件

## 报告 Bug

请使用 [bug 模板](.github/ISSUE_TEMPLATE/bug_report.yml) 提交 Issue，并包含：

- 触发的 skill / hook 名称
- Claude Code / Codex CLI 版本
- Node.js 版本与操作系统
- 复现步骤（仅贴公开 / 脱敏的样本）

## 建议特性

请使用 [feature 模板](.github/ISSUE_TEMPLATE/feature_request.yml)，先说清：

- 现有 skill / hook 为什么不够用
- 期望的最小行为变化
- 是否需要新组件，还是在既有 skill / agent / hook 内增补

## 安全问题

不要在公开 Issue 里贴敏感细节，请按 [SECURITY.md](./SECURITY.md) 流程上报。
