---
name: go-project-layout
description: 当 Go 项目需要确定目录结构、模块命名、workspace 配置、go.mod 管理、依赖审计或 CI 工作流时使用。
---

# go-project-layout

## 适用场景

- 新建 Go 项目或 monorepo，需要规划目录结构。
- 审查现有项目布局是否遵循 Go 惯例。
- 配置多模块 workspace（go.work）。
- 管理依赖版本、执行依赖审计或漏洞扫描。
- 设置 CI 中的 Go 构建与检查流水线。

包命名细节参见 [go-naming](../go-naming/SKILL.md)；依赖管理深度内容参见 [dependency-management](references/dependency-management.md)。

## 核心约束

| 类别 | 规则 | 说明 |
|------|------|------|
| cmd/ | 每个 main 包一个子目录 | `cmd/server/main.go`, `cmd/cli/main.go` |
| internal/ | 编译器阻止外部 import | 放私有实现，边界即契约 |
| pkg/ | 公共库代码（可选） | 社区惯例，标准库不用此目录 |
| api/ | API 定义（proto、OpenAPI） | 与实现分离 |
| configs/ | 配置模板（非运行时读取） | 运行时配置走环境变量 |
| web/ | 前端静态资源 | 纯后端项目不需要 |
| 模块路径 | 小写、无下划线、域名路径 | `github.com/org/project` |
| 单模块根 | go.mod 在仓库根 | 简单项目不要过早拆 workspace |
| 多模块 | go.work 管理本地开发 | 发布时各模块独立版本 |
| 配置来源 | 12-factor：环境变量优先 | 不硬编码文件路径 |
| 必备文件 | go.mod, .golangci.yml, Makefile | 保证构建可复现、lint 可执行 |
| 禁止包名 | utils, helpers, common, base | 用具体功能名替代 |

## 常见错误

| 错误做法 | 正确做法 | 原因 |
|----------|----------|------|
| 根目录放 main.go | `cmd/<binary>/main.go` | 多二进制项目无法扩展 |
| 创建 `pkg/utils/` | `pkg/tokenizer/`, `pkg/ratelimit/` | utils 语义空洞，破坏可发现性 |
| 把业务代码放 internal/ 外 | 独立项目全部可放 internal/ | 防止外部依赖内部实现细节 |
| go.mod 用大写或下划线 | 全小写、连字符分隔 | `github.com/org/my-project` |
| 运行时读 configs/*.yaml | 环境变量 + 结构体映射 | 12-factor，部署环境一致 |
| 没有 go.sum 提交 | go.sum 必须入库 | 保证依赖完整性可审计 |
| 手动编辑 go.mod 版本 | `go get`, `go mod tidy` | 手动改容易产生不一致 |

## 推荐目录结构

```
my-project/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── domain/
│   ├── service/
│   └── repository/
├── pkg/                  # 可选，对外库
│   └── client/
├── api/
│   └── proto/
├── configs/              # 模板，非运行时
├── go.mod
├── go.sum
├── .golangci.yml
├── Makefile
└── go.work               # 多模块时才有
```

## 深度参考

- [依赖管理详解](references/dependency-management.md)：go.mod 结构、最小版本选择、govulncheck、workspace 模式、依赖冲突处理。
