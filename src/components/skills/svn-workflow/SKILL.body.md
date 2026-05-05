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
