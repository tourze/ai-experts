# Go 密码学与密钥管理深度参考

**不要自己实现密码学算法。** 使用 `crypto/*` 和 `golang.org/x/crypto/*`。

## 对称加密：AES-GCM

```go
func encrypt(key, plaintext []byte) ([]byte, error) {
    block, _ := aes.NewCipher(key) // key: 16/24/32 字节
    gcm, _ := cipher.NewGCM(block)
    nonce := make([]byte, gcm.NonceSize())
    crypto_rand.Read(nonce)
    return gcm.Seal(nonce, nonce, plaintext, nil), nil // nonce 前置于密文
}

func decrypt(key, ct []byte) ([]byte, error) {
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)
    ns := gcm.NonceSize()
    if len(ct) < ns { return nil, fmt.Errorf("too short") }
    return gcm.Open(nil, ct[:ns], ct[ns:], nil)
}
```

禁止 ECB（泄漏模式）、CBC 无 HMAC（padding oracle）、DES/3DES（密钥过短）、RC4（偏差攻击）。

## 随机数

```go
// FAIL — math/rand 可预测
token := rand.Intn(999999)

// PASS
func generateToken(n int) (string, error) {
    b := make([]byte, n)
    if _, err := crypto_rand.Read(b); err != nil { return "", err }
    return hex.EncodeToString(b), nil
}
```

token、密钥、nonce、salt、IV 一律使用 `crypto/rand`。

## 密码哈希

```go
// Argon2id（推荐）— OWASP 参数
argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
// iterations=3, memory=64MB, threads=4, keyLen=32

// bcrypt（备选）
hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12) // cost=12
ok := bcrypt.CompareHashAndPassword(hash, []byte(password)) == nil
```

禁止 MD5（碰撞）、SHA-1（碰撞）、裸 SHA-256（无 salt 无迭代）。

## 时序攻击防御

```go
// FAIL — 比较耗时与公共前缀成正比
if token == expected { ... }
if bytes.Equal(token, expected) { ... }

// PASS
if subtle.ConstantTimeCompare(token, expected) == 1 { /* 通过 */ }
```

适用于 API key、JWT 签名、HMAC、重置 token 等所有密钥/凭证比较。

## TLS 配置

```go
&tls.Config{
    MinVersion: tls.VersionTLS12,
    CipherSuites: []uint16{
        tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
        tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
        tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
        tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
        tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
        tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
    },
}
```

## 密钥管理

```go
// FAIL — 硬编码
const apiKey = "sk-live-abc123"

// PASS — 环境变量
apiKey := os.Getenv("API_KEY")

// 密钥生成
func generateAESKey() ([]byte, error) {
    key := make([]byte, 32) // AES-256
    _, err := crypto_rand.Read(key)
    return key, err
}
```

密钥轮换要点：设置过期时间、存储版本号支持新旧密钥共存、生产环境使用 Vault / AWS KMS。
