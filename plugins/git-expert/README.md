# git-expert

Git 版本控制专家插件，提供 SessionStart 工作流提醒、分支命名规范、提交信息守卫、破坏性命令拦截、提交范围检查、批量暂存拦截和锁文件处理。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 skills 与 hooks 入口。
- `hooks/`：`hooks.json`、`dispatch.mjs`、SessionStart context 与 Git 相关 PreToolUse Bash hook。
- `skills/`：Git 工作流、GitHub 检索、工程复盘与经验提炼类 skill。

## Skills

| Skill | 用途 |
|-------|------|
| `git-advanced-workflows` | 高级 Git 工作流（rebase、cherry-pick、bisect、worktree、reflog） |
| `github-deep-research` | GitHub 仓库多轮深度研究（时间线分析、指标统计） |
| `github-repo-search` | GitHub 开源项目搜索与筛选 |
| `author-contributions` | Git 历史作者贡献文件追踪（跨 rename） |
| `engineering-retro` | Git 历史工程回顾（提交/PR/速度分析） |
| `lesson-learned` | Git 历史代码变更经验提取 |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| SessionStart | `git-workflow-context` | 注入 Git 起手纪律：先看仓库状态，提交前先审 staged diff |
| PreToolUse Bash | `git-add-guard` | 拦截 `git add -A` / `git add .` 批量暂存 |
| PreToolUse Bash | `git-stale-lock-guard` | 检测并清理 stale 的 `.git/index.lock` |
| PreToolUse Bash | `branch-naming-guard` | 强制 `<type>/<slug>` 分支命名规范 |
| PreToolUse Bash | `git-destructive-command-guard` | 拦截 `git reset --hard` / `git checkout -- .` / `git restore --source=HEAD` |
| PreToolUse Bash | `git-commit-heredoc-guard` | 拦截 `git commit -m "$(cat <<EOF ...)"` 形式的提交信息 |
| PreToolUse Bash | `commit-message-guard` | Conventional Commits 格式 + 模糊信息拦截 |
| PreToolUse Bash | `commit-scope-guard` | 提交范围启发式检查（文件数/目录扩散/关注点混合） |

## 安装

```bash
claude --plugin-dir /path/to/plugins/git-expert
```

## 验证命令

```bash
find hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
python3 -m py_compile skills/github-deep-research/scripts/github_api.py
node --test tests/*.test.mjs
```
