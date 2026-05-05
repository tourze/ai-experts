## 核心约束

- 提交前先执行 `svn update`，确保基线最新，再处理冲突并复查 `svn diff`。
- `svn add` 与 `svn commit` 必须带显式路径；禁止 `svn add .`、`svn add --force`、`svn commit` 无路径提交。
- `tags/` 视为只读快照；要修补发布内容，创建新 tag，不直接修改已有 tag。
- 从 Subversion 1.8 开始，不再推荐旧式 reintegrate 参数；整分支回合并应直接执行 `svn merge ^/branches/<name>`。
- 查询 mergeinfo 时显式写出 `--show-revs=eligible` 或 `--show-revs=merged`，不要依赖默认输出。
- `svn:ignore` 只作用于当前目录；需要对子树统一生效时，优先使用 `svn:global-ignores`（客户端/服务端至少 1.8）。
- `svn cleanup --remove-unversioned` 仅在 1.9+ 客户端可用；旧环境只执行 `svn cleanup`，未纳管文件手工清理。

## 代码模式

### 模式 1：日常开发闭环

```bash
# 检出工作副本
svn checkout https://svn.example.com/repos/project/trunk project-trunk

# 开发前与提交前都执行一次
svn update
svn status -u
svn diff path/to/file

# 只提交当前任务涉及的文件
svn commit path/to/file -m "fix(auth): 修复 token 过期后刷新失败的问题"
```

### 模式 2：分支、标签与工作副本切换

```bash
# 从 trunk 创建功能分支
svn copy https://svn.example.com/repos/project/trunk \
  https://svn.example.com/repos/project/branches/feature/oauth-login \
  -m "feat(repo): 创建 OAuth 登录功能分支"

# 发布时从 trunk 创建 tag
svn copy https://svn.example.com/repos/project/trunk \
  https://svn.example.com/repos/project/tags/v2.1.0 \
  -m "chore(release): 标记 v2.1.0 发布"

# 将当前工作副本切到功能分支
svn switch https://svn.example.com/repos/project/branches/feature/oauth-login
svn info
```

### 模式 3：Cherry-pick 合并与整分支回合并

```bash
# 在功能分支工作副本中，挑 trunk 的单个修订
svn merge -c 1234 https://svn.example.com/repos/project/trunk
svn status
svn commit path/to/file -m "fix(auth): 合并 trunk 上的 r1234 修复"

# 查看仍可从 trunk 合并的修订
svn mergeinfo --show-revs=eligible https://svn.example.com/repos/project/trunk .

# 查看已经合并过的修订
svn mergeinfo --show-revs=merged https://svn.example.com/repos/project/trunk .

# 整分支回合并到 trunk（Subversion 1.8+，不要再用旧式 reintegrate 参数）
cd /path/to/trunk-working-copy
svn update
svn merge https://svn.example.com/repos/project/branches/feature/oauth-login
svn status
svn commit path/to/changed-file -m "feat(auth): 合并 OAuth 登录功能分支"
```

### 模式 4-5：属性、仓库维护、迁移

详细命令见 [references/properties-and-admin.md](references/properties-and-admin.md)。要点：

- `svn:ignore`（仅当前目录）vs `svn:global-ignores`（子树继承，Subversion 1.8+）
- `svnadmin hotcopy` / `dump` / `load` 做备份与迁移
- `svn cleanup` 修复异常工作副本，1.9+ 支持 `--remove-unversioned`
- `git svn clone --trunk= --branches= --tags= --authors-file=` 做 SVN→Git 迁移

## 检查清单

- `svn status` 中只包含当前任务相关文件，没有顺手带上的其他改动。
- 提交命令包含显式路径，提交说明能回答“改了什么、为什么改”。
- 分支回合并前，目标工作副本已 `svn update`，且没有本地脏改动。
- 使用 `svn mergeinfo` 时显式写出 `--show-revs=eligible|merged`。
- 忽略策略是否选对：单目录用 `svn:ignore`，子树继承用 `svn:global-ignores`。
- 旧环境兼容性是否确认：`svn cleanup --remove-unversioned` 与自动 reintegration 依赖较新客户端。
- 做 SVN→Git 迁移前已准备 `authors.txt`，并确认 `trunk/branches/tags` 路径名与仓库真实布局一致。

## 反模式

### FAIL: svn add . + 模糊提交

```bash
svn add .
svn commit -m “fix”
# 把临时文件 / .DS_Store / 调试日志全部加进版本库
# commit message 无信息量
```

### PASS: 显式路径 + 信息

```bash
svn status  # 先看
svn add path/to/specific/file.java
svn commit path/to/specific/file.java \
  -m “fix(auth): refresh token 过期时调用错误 endpoint”
```

### FAIL: 直接改 tags/

```bash
cd tags/v2.1.0
# 编辑文件 → svn commit
# 标签变可写 → 失去发布快照价值
```

### PASS: 新建 hotfix tag

```bash
svn copy ^/branches/hotfix/v2.1.1 ^/tags/v2.1.1 \
  -m “chore(release): v2.1.1 hotfix”
# tags/ 始终只读，每个发布是独立快照
```

### FAIL: 脏工作副本合并

```bash
# 工作副本有未提交修改
svn merge ^/branches/feature
# 冲突无法分清是 merge 引入还是本地修改
```

### PASS: 干净副本 + update

```bash
svn status  # 必须为空
svn update  # 拉最新
svn merge ^/branches/feature
svn commit ...
```
