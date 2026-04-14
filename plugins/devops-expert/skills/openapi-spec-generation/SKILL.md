---
name: openapi-spec-generation
description: 当用户需要创建、维护或校验 OpenAPI 3.1 规范时使用，覆盖设计优先、代码优先与契约校验场景。
---

# OpenAPI 规范生成

## 适用场景
- 从零编写 OpenAPI 3.1 规范。
- 从现有 API 实现反推出契约文档。
- 为 SDK、Mock、文档站或契约测试提供统一源文件。

## 核心约束
- 目标版本默认为 OpenAPI 3.1.0，除非项目已有明确约束。
- 路径、参数、响应和错误模型必须显式建模，不能只写 happy path。
- 示例数据要与 schema 一致，避免文档可读但不可用。
- 大型规范优先拆分 `components` 与 `paths`，避免单文件失控。

## 代码模式
- 基础规范骨架：

```yaml
openapi: 3.1.0
info:
  title: User API
  version: 1.0.0
servers:
  - url: https://api.example.com/v1
paths:
  /users:
    get:
      operationId: listUsers
      summary: 列出用户
      responses:
        "200":
          description: 成功返回用户列表
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:
          type: string
        email:
          type: string
          format: email
```

- 需要代码优先实践时，查看 [references/code-first-and-tooling.md](references/code-first-and-tooling.md)。

## 检查清单
- 是否定义了版本、服务器地址、认证方式和错误响应模型。
- 是否为每个 path operation 提供 `operationId`、参数和响应码。
- 是否复用了共享 schema、参数和 response 组件。
- 是否让示例、默认值和枚举值与 schema 保持一致。
- 如果 API 生成流程嵌入 CI，参阅 [create-github-action-workflow-specification](../create-github-action-workflow-specification/SKILL.md)。

## 反模式
- 把实现细节和运行命令写进契约规范。
- 只有 200 响应，没有 4xx/5xx 错误模型。
- 同一个字段在多个路径下重复定义、互相漂移。
- 使用 OpenAPI 3.1，却继续沿用与 JSON Schema 不兼容的旧写法而不校验。
