# git-expert

Git 版本控制专家能力，提供分支命名规范、提交信息守卫、破坏性命令拦截、提交范围检查、partial staging 提醒、批量暂存拦截和锁文件处理。

## 目录结构

- `hooks/`：9 个 Git 相关 PreToolUse Bash 守卫。
- `skills/`：Git 工作流、GitHub 检索、工程复盘与经验提炼类 skill。
- `.mcp.json`：GitHub Copilot MCP 声明；配置 `CODEX_GITHUB_PERSONAL_ACCESS_TOKEN` 后由仓库根安装脚本统一同步。

## Skills

| Skill | 用途 |
|-------|------|
| `commit` | 结构化提交流程（状态检查 → 精确暂存 → diff 审查 → Conventional Commit） |
| `git-advanced-workflows` | 高级 Git 工作流（rebase、cherry-pick、bisect、worktree、reflog） |
| `github-repo-search` | GitHub 开源项目搜索与筛选 |
| `author-contributions` | Git 历史作者贡献文件追踪（跨 rename） |
| `engineering-retro` | Git 历史工程回顾（提交/PR/速度分析） |
| `lesson-learned` | Git 历史代码变更经验提取 |
| `finishing-branch` | 当实现完成、测试通过、需要决定如何集成工作时使用——引导完成开发分支的验证、选项展示和清理工作。 |
| `record-session` | 当用户要记录本次开发会话的成果摘要、保存 session journal 或在结束工作前总结做了什么时使用。 |
| `session-finalization-workflow` | 从"代码完成"推到"可交付状态"的完整 checklist，含深度复盘与治理资产沉淀（MEMORY / 工作流 / Skill / Hooks） |

## Agents

| Agent | 用途 |
|-------|------|
| `git-historian` | analyze git history, contribution patterns, code evolution, and change hotspots |
| `session-finalizer` | 把一次工作会话从"代码完成"推到"可交付状态"——按"自检验证 → 分支收尾 → 提交 → 会话记录 → 复盘 → 评审响应"序列编排 |

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

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

## 验证命令

```bash
find hooks -type f -name '*.mjs' -print0 | xargs -0 -n1 node --check
node --test tests/*.test.mjs
```
