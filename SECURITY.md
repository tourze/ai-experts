# 安全策略

## 支持版本

`ai-experts` 没有发版周期，安全修复直接在 `master` 上做。建议用户保持本地仓库与 upstream 同步，并重跑 `npm run build:components` 重新生成 `dist/claude/` 与 `dist/codex/`。

## 报告漏洞

请**不要**在公开 Issue 里贴敏感细节。

优先流程：

1. 通过 GitHub 的 "Report a vulnerability" 私有上报通道（如开启）
2. 若该通道不可用，开一个最小信息量的 Issue，请求私有联系方式

请尽量包含：

- 受影响的 component / skill / agent / hook / procedure
- 影响摘要（攻击面 / 数据流 / 触发条件）
- 复现步骤或 PoC
- 建议的缓解或修复方向

## 安全边界

本仓库的 hooks 和 procedures 在用户机器上以**用户权限**执行；skills、agents 和 instructions 是注入 Claude Code / Codex 上下文的文本配置。

需要重点关注的攻击面：

- **dist/*/hooks/dispatch.mjs**：统一调度生成的 hook 模块，禁止从 hook 中执行未经验证的外部输入
- **dist/*/procedures.js**：统一打包 procedure 入口，所有参数、环境变量、文件路径和外部命令都必须在 procedure 边界校验
- **src/build/**：负责把 `src/components/` 生成到 `dist/claude/` 与 `dist/codex/`，不得输出多余嵌套配置根或旧 scripts/plugins 结构
- **src/components/instructions/**：生成 `CLAUDE.md` / `AGENTS.md` 并注入 CLI 会话，须避免写入特权指令或绕过权限的提示

## 范围

- component 源码、hook/procedure 源码、构建器和生成的 `dist/` 配置属于本仓库范围
- 用户本地 `~/.claude/settings.local.json` 中由用户自行配置的 hook / permission **不属于**本仓库范围
- skill/reference/README 引用的第三方资源（外链、二进制、模型权重）不属于本仓库范围
