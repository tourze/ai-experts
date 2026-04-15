---
name: svn-workflow
description: 当用户要执行 SVN 日常操作、管理分支标签、处理合并冲突、配置属性、维护仓库或做 SVN 到 Git 迁移时使用。
---

# SVN 工作流

## 适用场景

- 需要在 SVN 项目中执行 `checkout`、`update`、`status`、`diff`、`commit` 等日常操作。
- 需要设计或审查 `trunk / branches / tags` 布局、分支命名、标签创建和发布流程。
- 需要处理 `svn merge`、`svn mergeinfo`、冲突解决、回滚修订与长期分支同步。
- 需要配置 `svn:ignore`、`svn:global-ignores`、`svn:eol-style`、`svn:externals` 等属性。
- 需要做仓库管理、热备份、dump/load 或 SVN→Git 迁移；迁移完成后的 Git 历史整理可衔接 [git-advanced-workflows](../../../git-expert/skills/git-advanced-workflows/SKILL.md)。

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

### 模式 4：属性配置

```bash
# 当前目录的忽略规则
svn propset svn:ignore $'target\nnode_modules\n.idea\n' .

# 需要对子树继承时使用 svn:global-ignores（Subversion 1.8+）
svn propset svn:global-ignores $'*.pyc\n*.class\n*.jar\n' .

# 统一换行策略
svn propset svn:eol-style native path/to/file.java

# 外部依赖固定到指定路径 / 修订
svn propset svn:externals $'libs/common https://svn.example.com/repos/common-lib/trunk\nlibs/utils -r 500 https://svn.example.com/repos/utils/tags/v1.0\n' .
```

### 模式 5：仓库维护与迁移

```bash
# 创建与热备份
svnadmin create /path/to/repos
svnadmin hotcopy /path/to/repos /path/to/backup

# 导出 / 导入
svnadmin dump /path/to/repos > full-dump.svn
svnadmin load /path/to/new-repos < full-dump.svn

# 工作副本异常恢复
svn cleanup
svn cleanup --remove-unversioned

# SVN -> Git 迁移
git svn clone https://svn.example.com/repos/project \
  --trunk=trunk --branches=branches --tags=tags \
  --authors-file=authors.txt project-git
```

## 检查清单

- `svn status` 中只包含当前任务相关文件，没有顺手带上的其他改动。
- 提交命令包含显式路径，提交说明能回答“改了什么、为什么改”。
- 分支回合并前，目标工作副本已 `svn update`，且没有本地脏改动。
- 使用 `svn mergeinfo` 时显式写出 `--show-revs=eligible|merged`。
- 忽略策略是否选对：单目录用 `svn:ignore`，子树继承用 `svn:global-ignores`。
- 旧环境兼容性是否确认：`svn cleanup --remove-unversioned` 与自动 reintegration 依赖较新客户端。
- 做 SVN→Git 迁移前已准备 `authors.txt`，并确认 `trunk/branches/tags` 路径名与仓库真实布局一致。

## 反模式

- `svn add .`、`svn add --force`、`svn commit -m "fix"` 这类批量或模糊命令直接进入生产工作流。
- 把 `svn mergeinfo` 默认输出当作“已合并修订列表”使用；1.8 起默认输出已经变了。
- 在 1.8+ 仍机械使用旧式 reintegrate 参数，导致流程与当前客户端语义脱节。
- 试图通过递归 `svn:ignore` 解决整棵子树忽略问题，却忘了它本身不具备继承语义。
- 直接修改 `tags/`、在脏工作副本上合并、或在未 `svn update` 的情况下提交。
