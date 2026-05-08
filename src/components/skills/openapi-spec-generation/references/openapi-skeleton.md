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

- 需要代码优先实践时，查看 [references/code-first-and-tooling.md](./code-first-and-tooling.md)。
