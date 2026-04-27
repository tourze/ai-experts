# svn-expert

SVN（Subversion）版本控制专家插件，提供工作流指导、批量操作守卫和提交信息质量检查。

## 目录结构

- `hooks/`：`hooks.json`、`dispatch.mjs` 以及 SVN 相关 `PreToolUse Bash` hook。
- `skills/`：SVN 日常开发、分支合并、属性配置、仓库维护与迁移类 skill。
- `tests/`：manifest、dispatch、hook 与 skill 文档校验。

## Skills

| Skill | 用途 |
|-------|------|
| `svn-workflow` | SVN 日常开发、分支/标签管理、合并策略、属性配置、仓库维护与迁移 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PreToolUse Bash | `svn-bulk-operation-guard` | 拦截 `svn add .`、`svn add --force`、`svn commit` 无路径、`--targets` 隐式批量路径 |
| PreToolUse Bash | `svn-commit-message-guard` | 拦截过短/模糊提交信息，并对非 Conventional Commits 给出 report 提示 |

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
jq empty hooks/hooks.json
node --check hooks/dispatch.mjs
for f in hooks/pre-tool-use/bash/*.mjs; do node --check "$f"; done
node --test tests/*.test.mjs
```
