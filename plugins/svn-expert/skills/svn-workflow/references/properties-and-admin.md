# SVN Properties And Admin

`svn-workflow` 主文档把属性管理、仓库维护和迁移放在一个入口，这里补齐常见命令模板。

## 属性管理

### `svn:ignore`

```bash
svn propset svn:ignore $'build\n.tmp\n*.log' .
svn propget svn:ignore .
svn commit . -m "chore(repo): 更新当前目录忽略规则"
```

适用：只影响当前目录，不会自动递归到子目录。

### `svn:global-ignores`

```bash
svn propset svn:global-ignores $'node_modules\ncoverage\n*.swp' .
svn propget svn:global-ignores .
svn commit . -m "chore(repo): 补充子树级忽略规则"
```

适用：Subversion 1.8+，对子树更友好。

### 其他常见属性

```bash
svn propset svn:eol-style native path/to/file.sh
svn propset svn:externals 'shared-lib https://svn.example.com/repos/shared-lib/trunk' vendor
svn commit path/to/file.sh vendor -m "chore(repo): 规范换行与 externals"
```

## 仓库维护

### hotcopy / dump / load

```bash
svnadmin hotcopy /srv/svn/project /backup/project-hotcopy
svnadmin dump /srv/svn/project > /backup/project.dump
svnadmin create /srv/svn/project-restored
svnadmin load /srv/svn/project-restored < /backup/project.dump
```

### cleanup

```bash
svn cleanup
svn cleanup --remove-unversioned
```

说明：

- `--remove-unversioned` 需要较新的客户端。
- 旧环境只执行 `svn cleanup`，未纳管文件手工删除。

## SVN → Git 迁移

```bash
git svn clone https://svn.example.com/repos/project \
  --trunk=trunk \
  --branches=branches \
  --tags=tags \
  --authors-file=authors.txt \
  project-git
```

迁移前至少确认三件事：

- `authors.txt` 已覆盖真实提交人映射。
- `trunk / branches / tags` 路径名与仓库实际布局一致。
- 大文件、externals、属性策略是否要在 Git 侧重建。
