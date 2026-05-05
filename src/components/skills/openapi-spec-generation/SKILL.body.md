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

## 反模式

### FAIL: 只写 200 无错误模型

```yaml
responses:
  "200":
    description: 创建成功
# 客户端不知道 4xx/5xx 长什么样
```

### PASS: 覆盖错误模型

```yaml
responses:
  "201": { description: 创建成功 }
  "400": { $ref: '#/components/responses/ValidationError' }
  "409": { $ref: '#/components/responses/Conflict' }
```

### FAIL: 字段重复定义漂移

```yaml
# /users/{id} GET：id 是 string
# /users POST：id 是 integer
# → 客户端代码生成崩溃
```

### PASS: 共享 schema 组件

```yaml
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id:    { type: string, format: uuid }
        email: { type: string, format: email }

# 所有路径复用 $ref: '#/components/schemas/User'
```
