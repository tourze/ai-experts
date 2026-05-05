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
