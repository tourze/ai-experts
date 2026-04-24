# git-expert

Git 版本控制专家插件，提供分支命名规范、提交信息守卫、破坏性命令拦截、提交范围检查、partial staging 提醒、批量暂存拦截和锁文件处理。

## 目录结构

- `.claude-plugin/plugin.json`：插件清单，显式声明 `skills/`；标准 `hooks/hooks.json` 会由 Claude 自动加载。
- `hooks/`：`hooks.json`、`dispatch.mjs` 与 Git 相关 PreToolUse Bash hook。
- `skills/`：Git 工作流、GitHub 检索、工程复盘与经验提炼类 skill。

## Skills

| Skill | 用途 |
|-------|------|
| `commit` | 结构化提交流程（状态检查 → 精确暂存 → diff 审查 → Conventional Commit） |
| `git-advanced-workflows` | 高级 Git 工作流（rebase、cherry-pick、bisect、worktree、reflog） |
| `github-deep-research` | GitHub 仓库多轮深度研究（时间线分析、指标统计） |
| `github-repo-search` | GitHub 开源项目搜索与筛选 |
| `author-contributions` | Git 历史作者贡献文件追踪（跨 rename） |
| `engineering-retro` | Git 历史工程回顾（提交/PR/速度分析） |
| `lesson-learned` | Git 历史代码变更经验提取 |
| `finishing-branch` | 当实现完成、测试通过、需要决定如何集成工作时使用——引导完成开发分支的验证、选项展示和清理工作。 |
| `record-session` | 当用户要记录本次开发会话的成果摘要、保存 session journal 或在结束工作前总结做了什么时使用。 |

## Agents

| Agent | 用途 |
|-------|------|
| `git-historian` | analyze git history, contribution patterns, code evolution, and change hotspots |

## Hooks

| 事件 | Hook | 作用 |
|------|------|------|
| PreToolUse Bash | `git-add-guard` | 拦截 `git add -A` / `git add .` 批量暂存 |
| PreToolUse Bash | `git-stale-lock-guard` | 检测并清理 stale 的 `.git/index.lock` |
| PreToolUse Bash | `branch-naming-guard` | 强制 `<type>/<slug>` 分支命名规范 |
| PreToolUse Bash | `git-destructive-command-guard` | 拦截 `git reset --hard` / `git checkout -- .` / `git restore --source=HEAD` / `git clean -f` / `git push --force` / `git branch -D` / `git stash drop\|clear` |
| PreToolUse Bash | `git-commit-heredoc-guard` | 拦截 `git commit -m "$(cat <<EOF ...)"` 形式的提交信息 |
| PreToolUse Bash | `commit-message-guard` | Conventional Commits 格式 + 模糊信息拦截 |
| PreToolUse Bash | `partial-staging-guard` | 检测同一文件同时存在 staged 与 unstaged 改动 |
| PreToolUse Bash | `commit-scope-guard` | 提交范围启发式检查（文件数/目录扩散/monorepo 包扩散/关注点混合） |

## 安装

```bash
claude --plugin-dir /path/to/plugins/git-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install git-expert@ai-experts
claude plugin install git-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall git-expert
claude plugin uninstall git-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。

## 验证命令

```bash
find hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
python3 -m py_compile skills/github-deep-research/scripts/github_api.py
node --test tests/*.test.mjs
```
