# 安全策略

## 支持版本

`ai-experts` 没有发版周期，安全修复直接在 `master` 上做。建议用户保持本地仓库与 upstream 同步并重跑 `scripts/install.mjs`。

## 报告漏洞

请**不要**在公开 Issue 里贴敏感细节。

优先流程：

1. 通过 GitHub 的 "Report a vulnerability" 私有上报通道（如开启）
2. 若该通道不可用，开一个最小信息量的 Issue，请求私有联系方式

请尽量包含：

- 受影响的插件 / skill / hook
- 影响摘要（攻击面 / 数据流 / 触发条件）
- 复现步骤或 PoC
- 建议的缓解或修复方向

## 安全边界

本仓库的 hooks 在用户机器上以**用户权限**执行 shell 命令；skills 是注入 Claude Code / Codex 上下文的 markdown。

需要重点关注的攻击面：

- **hooks/dispatch.mjs 与各插件 dispatch.mjs**：会动态执行 `plugins/<plugin>/hooks/<event>/*.mjs`，禁止从这些 hook 里执行未经验证的外部输入
- **install.mjs**：会 `symlink` 到 `~/.claude` 与 `~/.codex`，并写入 `settings.json` / `hooks.json`；改动需保证 `--dry-run` 始终不接触磁盘
- **MEMORY.md**：被软链到用户级记忆文件，会注入到所有 CLI 会话，须避免写入特权指令或绕过权限的提示

## 范围

- 插件代码、hook 脚本、install/sync 脚本属于本仓库范围
- 用户本地 `~/.claude/settings.local.json` 中由用户自行配置的 hook / permission **不属于**本仓库范围
- 插件 README 引用的第三方资源（外链、二进制、模型权重）不属于本仓库范围
