# 依赖管理详解

## go.mod 结构

```
module github.com/org/project

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    golang.org/x/text v0.14.0
)
```

- `module`：模块路径，唯一标识 + import 路径前缀。
- `go`：最低 Go 版本，同时决定语言特性（泛型需 1.18+）。
- `require`：直接依赖及其版本。
- `indirect` 注释：间接依赖，由 `go mod tidy` 自动标记。

## 语义版本与最小版本选择

SemVer：`vMAJOR.MINOR.PATCH`。MAJOR 不兼容时 import 路径必须变（`/v2` 后缀）。

Go 使用**最小版本选择（MVS）**：选中所有依赖要求的**最小满足版本**，而非最新版。保证构建可复现。

```bash
go list -m all    # 查看最终选中的版本
```

## go.sum

`go.sum` 记录每个依赖模块的 SHA-256 哈希，用于完整性校验和可复现构建。必须提交到版本控制，不要加入 .gitignore。

## 升级依赖

```bash
go get github.com/gin-gonic/gin@latest     # 升级到最新兼容版
go get github.com/gin-gonic/gin@v1.10.0    # 升级到特定版本
go mod tidy                                  # 清理未用依赖、补充间接依赖
go mod graph                                 # 查看依赖关系图
go mod why github.com/pkg/errors            # 查看依赖引入原因
```

升级后务必运行测试确认无破坏性变更。

## 漏洞扫描

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...                            # 扫描当前模块
```

`govulncheck` 利用调用链分析，只报告实际可达的漏洞，降低误报。建议集成到 CI。

## Workspace 模式（go.work）

多模块仓库用 `go.work` 管理本地开发：

```
// go.work
go 1.22

use (
    ./services/auth
    ./services/gateway
    ./pkg/shared
)
```

- `use` 指令将本地模块目录加入 workspace，开发时直接引用不走远程下载。
- 发布时各模块独立打 tag（`services/auth/v1.2.0`）。
- **不要提交 go.work 到生产仓库**，加入 `.gitignore` 或仅在本地使用。

```bash
go work init ./services/auth ./services/gateway   # 初始化
go work use ./pkg/shared                            # 添加模块
go work sync                                        # 同步依赖
```

## 依赖冲突处理

当不同依赖要求同一模块的不同版本：

1. **查看冲突**：`go mod graph | grep <module>`。
2. **MVS 自动解决**：多数情况无需手动干预。
3. **replace 指令**：上游长期不更新时手动指定替代：

```go
// go.mod
replace github.com/old/dep => github.com/new/dep v1.0.0
replace github.com/org/lib => ../local-lib       // 本地调试
```

4. **多版本共存**：MAJOR 变更视为不同模块，可同时引入：

```go
import (
    libv1 "github.com/org/lib"
    libv2 "github.com/org/lib/v2"
)
```

5. **vendor 模式**：`go mod vendor && go build -mod=vendor ./...`，完全脱离代理。
