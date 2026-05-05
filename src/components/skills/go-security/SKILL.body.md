## 适用场景

- 编写或审查涉及用户输入拼接到 SQL / shell 命令 / HTML 的代码。
- 实现 token 生成、密码存储、密钥管理、TLS 配置。
- 执行 `govulncheck` 或评估第三方依赖的安全风险。
- 需要防止路径穿越、SSRF、XSS 等注入类攻击。
- 运行时安全（nil、panic、数据竞争）使用 [go-safety](../go-error-handling/SKILL.md)；安全测试使用 [go-testing-patterns](../go-testing-patterns/SKILL.md)。

## 核心约束：安全思考模型

对任何外部输入，回答三个问题：

1. **信任边界在哪？** 哪些数据来自用户 / 网络 / 第三方，不可信？
2. **攻击者能控制什么？** 输入参数、Header、URL、文件名、数据库字段？
3. **爆炸半径多大？** 泄露密钥？执行任意命令？越权访问？

## 严重性评级（DREAD 简化）

| 级别 | 条件 | 示例 |
|------|------|------|
| Critical | 远程无需认证，可执行任意代码 | 命令注入、反序列化 RCE |
| High | 远程可泄露敏感数据或绕过认证 | SQL 注露密码哈希、硬编码密钥 |
| Medium | 需要特定条件或有限影响 | XSS（存储型）、SSRF 内网探测 |
| Low | 影响有限或需大量前置条件 | 反射型 XSS、信息泄露 |

## 常见漏洞速查

| 漏洞 | 防御 | 标准库 / 工具 |
|------|------|--------------|
| SQL 注入 | 参数化查询 | `database/sql` + 占位符 |
| 命令注入 | 分离参数，禁止拼接 | `exec.Command(name, args...)` |
| XSS | 自动转义 | `html/template` |
| SSRF | 校验目标 URL | 白名单域名 / IP 段 |
| 路径穿越 | 清洗路径 + 限制根目录 | `filepath.Clean` / `os.Root`(1.24+) |
| 弱随机 | 密码学安全随机 | `crypto/rand` |
| 弱密码哈希 | Argon2id / bcrypt | `golang.org/x/crypto/argon2` / `bcrypt` |
| 时序攻击 | 常量时间比较 | `crypto/subtle.ConstantTimeCompare` |
| 依赖漏洞 | 自动扫描 | `govulncheck ./...` |
| 硬编码密钥 | 环境变量 / 密钥管理服务 | `os.Getenv` / Vault |

## 关键防御模式

### 1. 参数化查询（禁止字符串拼接）

```go
// FAIL
db.Query("SELECT * FROM users WHERE id = " + userID)
// PASS
db.Query("SELECT * FROM users WHERE id = $1", userID)
```

### 2. 命令执行（分离参数）

```go
// FAIL
exec.Command("sh", "-c", "ls "+userDir)
// PASS
exec.Command("ls", userDir)
```

### 3. HTML 输出自动转义

```go
// FAIL — 手动标记信任
template.HTML(userInput)
// PASS — html/template 自动转义
tmpl.Execute(w, data)
```

### 4. 密码学安全随机

```go
// FAIL
rand.Intn(999999)  // math/rand
// PASS
b := make([]byte, 32)
crypto_rand.Read(b)
```

### 5. 密钥比较（防时序攻击）

```go
// FAIL
hmac.Equal([]byte("a"), []byte("b"))  // 仅 HMAC 适用
// PASS — 通用密钥比较
subtle.ConstantTimeCompare(a, b)
```

### 6. 依赖漏洞扫描

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```

## 检查清单

- 所有用户输入拼接到查询 / 命令 / HTML / 路径的地方是否使用安全 API？
- 密码存储是否使用 Argon2id / bcrypt？
- Token / 密钥生成是否使用 `crypto/rand`？
- 敏感数据比较是否使用 `subtle.ConstantTimeCompare`？
- 是否有硬编码密钥 / 凭据？
- 是否运行过 `govulncheck`？
- TLS 配置是否禁用过时协议（TLS 1.0/1.1）？

## 深度参考

- [injection.md](references/injection.md) — SQL 注入、命令注入、XSS、SSRF、路径穿越
- [cryptography.md](references/cryptography.md) — 加密、密码哈希、密钥管理、TLS 配置
