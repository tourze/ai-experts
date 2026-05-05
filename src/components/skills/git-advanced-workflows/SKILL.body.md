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
