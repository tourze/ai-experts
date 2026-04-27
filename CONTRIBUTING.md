# 贡献指南

感谢为 `ai-experts` 贡献代码。

## 开始之前

- Node.js 20 或更高版本
- 不需要 `npm install`：仓库未声明任何运行时依赖，`package.json` 仅提供脚本入口与版本约束
- 本仓库通过 `scripts/install.mjs` 把每个 `plugins/<plugin>/` 软链到 `~/.claude` 与 `~/.codex`，**不走** Claude Code / Codex 的 marketplace 安装链路

## 本地校验

提交 PR 前请在仓库根跑：

```bash
npm test
npm run install:dry
```

可选审计：

```bash
npm run audit:skills
npm run audit:triggers
npm run audit:hooks
```

## 开发流程

1. 从 `master` 切焦点分支
2. 做最小可行改动
3. 当改动影响行为或 surface 时，新增/更新对应 `tests/*.test.mjs`
4. 新增插件时**必须**：
   - 提供 `README.md` 与 `skills/`（最少结构）
   - 在仓库根 `CLAUDE.md` 的"已声明的插件依赖"段落同步声明依赖关系
   - 复用基座层（`coding-expert`）守卫，不在新插件里复刻通用守卫
5. 跑本地校验
6. 提 PR，按 `.github/PULL_REQUEST_TEMPLATE.md` 填写

## 新增 / 修改 hook 的安全审查清单

`hooks/dispatch.mjs` 在每次 Claude / Codex 触发对应事件时调用本仓库的 `.mjs` 文件，
等价于授予用户级本地代码执行能力。**合入新 hook = 增加 RCE 入口**，PR reviewer
必须显式确认下列每一项：

- [ ] 不发起任何外网请求（无 `fetch` / `http` / `https` / `net.connect` / `dns.lookup` / 子进程调用 `curl` `wget`）
- [ ] 不 `eval` / `Function()` 字符串，不 `import()` 用户输入拼出的路径
- [ ] 不写仓库目录与 `~/.claude` / `~/.codex` 之外的位置（telemetry / cache 必须用既有 `~/.claude/hook-telemetry/` 目录）
- [ ] 不读取敏感目录（`~/.ssh` / `~/.aws` / `~/.gnupg` / `~/.config/gh` / `/etc/shadow` 等）
- [ ] 不把 `tool_input.command` / `tool_input.file_path` 等 payload 直接拼接到 shell 字符串；调用外部命令必须用 `execFileSync` + 数组参数
- [ ] 任何 `execFileSync` / `execSync` 调用都设置了 `timeout`（建议 ≤ 5s 用于诊断 hook，≤ 10s 用于 syntax check）
- [ ] 所有用户级文件写入使用原子写（同目录 tmp + rename），参考 `scripts/sync-hooks.mjs:31-40`
- [ ] 异常路径不会阻塞 dispatcher：`run()` 抛错由 dispatcher 兜底，但 hook 内部不应主动 `process.exit()`（除非该值为 dispatcher 协议返回值）
- [ ] 配套 `tests/hooks.test.mjs` 同时覆盖 TP（应 block / report）与 TN（不应误拦），由 `tests/hook-adversarial-conformance.test.mjs` 强制
- [ ] 若新 hook 与基座 `coding-expert` 同名，需在 PR 描述给出语义差异理由；`tests/dependency-graph.test.mjs` 会拦截未声明的复刻

## 范围约束（Scope Guidelines）

本仓库目标是**多个领域专家插件的可组合集合**。可被接受的改动：

- 单插件内的 skill / hook / agent 增改
- 不破坏现有插件自包含约束的工程化改造
- 跨插件的依赖**声明**（在 manifest 与 CLAUDE.md），不是跨插件的源码 import

不接受：

- 插件之间直接 import / require 对方源码（违反硬约束：插件必须自包含）
- 在新插件里复刻通用守卫（应在基座层 `coding-expert` 收敛）
- 引入仓库级运行时 npm 依赖（`package.json` 仅作为开发态元数据）
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
- 是否需要新插件，还是在既有插件内增补

## 安全问题

不要在公开 Issue 里贴敏感细节，请按 [SECURITY.md](./SECURITY.md) 流程上报。
