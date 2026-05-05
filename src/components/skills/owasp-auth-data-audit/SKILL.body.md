覆盖认证会话、密钥管理、批量赋值三类安全审计。与 `frontend-dynamic-code-protection`（前端防刷视角）互补：本 skill 关注服务端认证和数据边界。

## 路由

| 触发信号 | 审计类型 |
|---------|---------|
| token/JWT/session/cookie/OAuth/`login`/`authenticate`/`set-cookie` | 认证会话审计 |
| secret/key/password/`api_key`/`API_KEY`/credential/PII/`process.env` | 密钥管理审计 |
| `assign(`/`bind(`/`updateAll`/`mass assignment`/ORM save/`$fillable`/`$guarded` | 批量赋值审计 |

## 认证会话审计

### 检查点

- **令牌生命周期**：access token 有效期是否 ≤ 15 分钟；refresh token 是否支持撤销；JWT 是否声明 `exp`/`iat`/`nbf`。
- **传输安全**：认证接口是否强制 HTTPS；cookie 是否设置 `Secure`/`httpOnly`/`SameSite=Strict` 或 `Lax`。
- **存储位置**：SPA 的 token 是否避免 `localStorage`（XSS 可读）；是否使用 httpOnly cookie 或 BFF 模式。
- **撤销机制**：是否有 token 黑名单或版本号机制；登出是否使所有会话失效。
- **MFA 覆盖**：敏感操作（修改密码、绑定手机、提现）是否强制 MFA 二次验证；是否有 MFA 疲劳攻击防护。
- **会话固定**：登录后是否轮换 session ID；是否接受外部传入的 session ID。
- **OAuth 流**：state 参数是否校验；redirect_uri 是否白名单；code 是否单次使用。

### 反模式

- JWT 不设过期时间，或过期时间设为数天而不提供撤销机制。
- token 存储在 `localStorage` 且未做 XSS 防护。
- cookie 缺少 `httpOnly`/`Secure`/`SameSite` 中的任一关键 flag。
- 敏感操作仅靠前端路由守卫，服务端不做二次鉴权。

## 密钥管理审计

### 检查点

- **硬编码检测**：代码、配置文件和 CI 脚本中是否存在硬编码的密钥、token、密码、私钥、证书。
- **存储层级**：敏感值是否正确使用了环境变量 → secret manager（Vault/AWS Secrets Manager）→ KMS 的层级递进。
- **日志脱敏**：日志输出、错误消息、调试端点是否可能泄漏密钥或 PII；是否对 `Authorization` header、password 字段做了脱敏。
- **版本控制**：`.env`/`.env.local`/`.env.production` 是否被 git 跟踪；历史提交中是否曾提交密钥（`git log -S`）。
- **最小权限**：API key 是否限制了 scope/IP 白名单/速率限制；是否区分开发/生产密钥。

### 反模式

- 把生产密钥写在源码注释中"方便本地调试"。
- 依赖 `.gitignore` 但不检查历史提交中的密钥残留。
- 在 error message 中直接返回数据库连接字符串或堆栈中含敏感参数。
- 所有环境用同一套密钥。

## 批量赋值审计

### 检查点

- **属性白名单**：ORM/DTO 是否定义了显式的可填充字段列表（如 Laravel `$fillable`、Spring `@ModelAttribute` 绑定白名单、Rails strong params）。
- **DTO 约束**：是否在输入层做字段级校验，而非依赖数据库约束兜底。
- **不可信输入绑定**：用户请求是否可直接修改 `role`/`isAdmin`/`balance`/`verified`/`status` 等敏感字段。
- **ORM 配置**：是否禁用了不安全的批量保存（如 Sequelize `save({fields: []})`、GORM `Select().Updates()`）。

### 反模式

- 使用 `$guarded = []`（空数组，无保护）或 `MassAssignment.allowAll()`。
- 直接用 `request.body` 或 `$_POST` 整体传入 ORM 的 create/update。
- 在 Controller 层做权限判断，但 Model 层不设任何字段保护。
- DTO 使用 `Partial<CreateDto>` 而不重新定义可更新字段子集。

## 审计输出

每条发现绑定：文件:行 + 代码片段 + 攻击向量 + 可利用性评估（confirmed/likely/speculative）。

```markdown
## 认证与数据安全审计结果

### 认证会话
| 位置 | 问题 | 严重度 | 证据 |
|------|------|--------|------|

### 密钥管理
| 位置 | 问题 | 严重度 | 证据 |
|------|------|--------|------|

### 批量赋值
| 位置 | 问题 | 严重度 | 证据 |
|------|------|--------|------|
```
