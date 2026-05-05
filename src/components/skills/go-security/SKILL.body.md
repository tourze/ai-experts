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

## 深度参考

- [injection.md](references/injection.md) — SQL 注入、命令注入、XSS、SSRF、路径穿越
- [cryptography.md](references/cryptography.md) — 加密、密码哈希、密钥管理、TLS 配置
