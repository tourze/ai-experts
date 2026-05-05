# 文档标准参考

## README 结构

```markdown
# 项目名

一句话说明做什么，不是怎么做。

## 安装

go get 命令 + 最小依赖要求（Go 版本）。

## 快速开始

5 行以内可运行的代码示例。不要在示例里展示高级特性。

## API 参考

公共 API 列表，每个一行说明。详细的留给 godoc。

## 配置

环境变量、配置文件、命令行 flag 的说明表。

## 贡献

开发环境搭建、测试命令、PR 流程。
```

## 代码注释

### 该写的注释

```go
// TokenBucket 限制每秒请求数。
// bucket 大小决定突发容量，refill rate 决定稳态吞吐。
//
// 不适合分布式限流——状态只存内存。
type TokenBucket struct { ... }

// HACK(zhangsan): 标准库 time.Format 在这个 Go 版本有时区 bug，
// 手动拼接绕过。升级到 1.22 后删除。
```

### 不该写的注释

```go
// Error 返回错误信息。
func (e *Error) Error() string { return e.msg }

// i 是循环变量。
for i := range items { }

// 此函数处理用户请求。
func Handle(req Request) error { ... }
```

规则：注释写"为什么"，不写"是什么"。

## CHANGELOG 格式

```markdown
## v1.2.0 (2026-04-27)

### 新增
- 添加 `RetryWithContext` 方法，支持取消链传播。

### 修复
- 修复高并发下连接池耗尽导致死锁的问题。

### 破坏性变更
- `NewClient` 不再接受 `timeout` 参数，改用 `WithTimeout` 选项。
  迁移：`NewClient(5*time.Second)` → `New(WithTimeout(5*time.Second))`
```

## godoc 规范

```go
// Package user 提供用户管理和认证功能。
//
// 基本用法：
//
//	store := user.NewStore(db)
//	u, err := store.Find(ctx, "user-123")
package user

// Find 返回指定 ID 的用户。
// 如果用户不存在，返回 ErrNotFound。
func (s *Store) Find(ctx context.Context, id string) (*User, error)
```

- 包注释放在 `package` 声明前
- 导出函数/类型注释以名称开头：`// Find 返回...`
- Example 测试作为可执行文档
