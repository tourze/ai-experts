---
name: author-contributions
description: 当用户要查看某个作者在分支上的实际贡献、做作者归属审计或回答”谁改了什么”时使用。
context: fork
agent: git-expert:git-historian
---

# 作者贡献追踪

## 适用场景

- 用户要看某个作者在当前分支相对 `main` 或其他上游分支的真实贡献面。
- 需要区分“作者直接修改了这个文件”和“作者改的是旧路径，后来被别人 rename 到当前路径”。
- 合并前要核对作者实际涉及的落地文件，而不是只看 commit 数量。

## 核心约束

- 只做只读分析，不改分支、不改索引、不改工作树。
- 先确定作者的精确 Git 身份，再做 `--author=` 过滤；禁止凭昵称或缩写猜测。
- rename 图必须覆盖分支上的全部提交，不能只看目标作者自己的 commit。
- 最终只汇报 `git diff <upstream>..<branch>` 里仍然会落地的文件；已经被删掉、不会合并的路径不要报。
- 大仓库优先用 Python 做集合与 rename 图计算，不要写脆弱的 shell 管道循环。

## 代码模式

### 1. 先解析作者身份

```bash
git log --format="%an <%ae>" <upstream>..<branch> | sort -u
```

- 从这里拿到精确的 `Full Name <email>`，再代入后续命令。

### 2. 收集作者直接动过的文件

```bash
git log --author="<Exact Name>" --format="%H" <upstream>..<branch>
git diff-tree --no-commit-id --name-only -r <hash>
```

- 把该作者所有 commit 触达的文件合并成 `author_files` 集合。

### 3. 为整条分支构建 rename 图

```bash
git log --format="%H" <upstream>..<branch>
git diff-tree --no-commit-id -r -M <hash>
```

- 解析 `R*` 记录，构建 `new_path -> {old_paths}`。
- 追链时要支持多跳：`a -> b -> c`。

### 4. 只看最终会落地的文件

```bash
git diff --name-only <upstream>..<branch>
git diff --stat <upstream>..<branch> -- <file1> <file2> ...
```

- 若最终文件在 `author_files` 中，标记为 `DIRECT`。
- 否则沿 rename 链回溯；只要祖先路径命中过 `author_files`，标记为 `VIA_RENAME`。

### 5. 推荐的 Python 骨架

```python
import subprocess

UPSTREAM = "origin/main"
AUTHOR = "Full Name <email>"

def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()

author_commits = [c for c in git("log", f"--author={AUTHOR}", "--format=%H", f"{UPSTREAM}..HEAD").splitlines() if c]
author_files = set()
for commit in author_commits:
    author_files.update(
        f for f in git("diff-tree", "--no-commit-id", "--name-only", "-r", commit).splitlines() if f
    )

rename_map: dict[str, set[str]] = {}
for commit in [c for c in git("log", "--format=%H", f"{UPSTREAM}..HEAD").splitlines() if c]:
    for line in git("diff-tree", "--no-commit-id", "-r", "-M", commit).splitlines():
        parts = line.split("\t")
        if len(parts) >= 3 and parts[0].startswith(":") and "R" in parts[0]:
            rename_map.setdefault(parts[2], set()).add(parts[1])
```

## 检查清单

- 是否先跑了作者身份枚举，而不是直接写 `--author=xxx`。
- 是否同时拿到了 `author_files`、`rename_map` 和最终 merge diff 文件列表。
- 是否对 rename 做了传递闭包，而不是只查一跳。
- 是否只输出最终会落地的文件，并补了 `git diff --stat` 统计。
- 是否在结论里区分了 `DIRECT` 与 `VIA_RENAME`。

## 反模式

### FAIL: 模糊作者名

```bash
git log --author=”Alice” --since=”2 weeks”
# 命中 Alice Wang / Alice Liu / alice@x.com / alice@y.com 全部
# 报告失真
```

### PASS: 精确身份

```bash
git log --format=”%an <%ae>” upstream..HEAD | sort -u
# 用户确认是哪个 “Alice Wang <alice.wang@company.com>”
git log --author=”alice.wang@company.com” ...
```

### FAIL: 不核对最终落地

```
报告 alice 改过 50 个文件
→ 但 30 个已被 bob 重构删除
→ 合并后 alice 只贡献 20 个 → 报告虚高
```

### PASS: 与 merge diff 交集

```bash
# 1. 拿 alice 历史触达的文件集
# 2. 拿 git diff upstream...HEAD 最终落地集
# 3. 取交集 → 真实 DIRECT 贡献
# 4. 沿 rename 链找 VIA_RENAME 间接贡献
```
