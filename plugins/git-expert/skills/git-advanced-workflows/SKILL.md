---
name: git-advanced-workflows
description: 当需要 rebase、cherry-pick、bisect、worktree、reflog 或从 Git 误操作中恢复时使用。
---

# Git 高级工作流

## 适用场景

- 提交历史很乱，需要在发 PR 前清理 commit 序列。
- 某个修复要从一个分支搬到另一个分支，但不想整体 merge。
- 需要通过二分法定位“哪一个 commit 引入了这个 bug”。
- 同时处理主线功能、热修和实验分支，不想来回 stash。
- 误删分支、误 reset、丢 commit 后，需要用 reflog 找回现场。

## 核心约束

- 先 `git status --short` 和 `git branch --show-current`，确认当前现场再动手。
- 改历史前先确认分支是否已共享；对共享分支改写历史时，只能在明确同意下执行。
- 强推只用 `git push --force-with-lease`，不要默认 `--force`。
- `reset --hard`、删除分支、覆盖工作树这类破坏性动作，必须是用户明确要求后的最后手段。
- 恢复现场优先 `git reflog` + 新建恢复分支，不要先执行更大的破坏性命令。

## 代码模式

### 1. 交互式 rebase 清理历史

```bash
git fetch origin
git rebase -i --autosquash "$(git merge-base HEAD origin/main)"
```

- 常见动作：`reword` 改 message、`fixup`/`squash` 合并碎提交、`drop` 删除明确无用的本地提交。
- 结束后若需要更新远端，使用：

```bash
git push --force-with-lease origin "$(git branch --show-current)"
```

### 2. cherry-pick 精准搬运提交

```bash
git checkout release/2.0
git cherry-pick <sha>
git cherry-pick <start_sha>^..<end_sha>
```

- 只搬确切需要的 commit；冲突后用 `git cherry-pick --continue` 或 `--abort`。
- 若想先把改动放进索引再自己组织提交，可用 `git cherry-pick -n <sha>`。

### 3. bisect 定位回归

```bash
git bisect start
git bisect bad HEAD
git bisect good <known-good-sha-or-tag>
git bisect run ./test.sh
git bisect reset
```

- 自动化脚本约定：退出码 `0` 表示 good，`1-127`（不含 `125`）表示 bad。
- 没有稳定测试时，不要硬跑 bisect；先补一个最小可复现脚本。

### 4. worktree 并行处理多个分支

```bash
git worktree list
git worktree add -b fix/urgent-login ../repo-fix origin/main
git worktree remove ../repo-fix
git worktree prune
```

- 热修、主线、实验分支并行时优先 worktree，不要频繁 stash/pop。
- 删除前先确认目录内没有未提交改动。

### 5. reflog 恢复误操作

```bash
git reflog --date=iso
git switch -c recovery/<topic> <sha>
```

- 先从 reflog 找回目标 SHA，再新建恢复分支核对内容。
- 只有在确认恢复点正确后，才考虑把它 cherry-pick 回当前工作分支。

## 检查清单

- 动手前是否确认了当前分支、工作树状态和远端同步状态。
- 改历史前是否判断“这是不是共享分支”。
- 强推时是否用了 `--force-with-lease`。
- 用 bisect 前是否准备了稳定、可脚本化的复现方式。
- 恢复误操作时是否先用 reflog 开恢复分支，而不是继续覆盖现场。

## 反模式

### FAIL: 共享分支裸 force push

```bash
git checkout main
git rebase -i HEAD~5
git push --force origin main
# 团队冲突，CI 历史断裂
```

### PASS: 个人分支改 + --force-with-lease

```bash
git checkout feature/my-branch
git rebase -i --autosquash “$(git merge-base HEAD origin/main)”
git push --force-with-lease origin feature/my-branch
```

### FAIL: 整支 merge 取一个提交

```bash
git merge feature/half-done  # 只要里面一个改动
# 半成品代码污染 hotfix 分支
```

### PASS: cherry-pick 精准搬运

```bash
git cherry-pick <sha>
```

### FAIL: 无稳定复现跑 bisect

```bash
git bisect start; git bisect bad HEAD; git bisect good v1.0
# 手工测试 → “这个版本好像有问题？”
```

### PASS: 可脚本化复现

```bash
git bisect start HEAD v1.0
git bisect run ./reproduce.sh  # 自动定位
```
