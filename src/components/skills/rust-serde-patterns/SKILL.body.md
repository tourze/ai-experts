## 代码模式

- [Internally tagged enum](references/patterns.md#模式-1)
- [向后兼容结构体演进](references/patterns.md#模式-2)
- [自定义序列化 Duration 转毫秒](references/patterns.md#模式-3)
- [反序列化时校验](references/patterns.md#模式-4)

## 反模式

### FAIL: 所有类型 deny_unknown_fields

```rust
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct UserConfig { name: String }
// 服务端加字段 email → 旧客户端全挂
```

### PASS: 只在 API 入口用

```rust
#[derive(Deserialize)] struct UserConfig { name: String }  // 容忍

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct PaymentRequest { amount: f64 }  // API 入口才严格
```

### FAIL: 重命名不加 alias

```rust
#[serde(rename = "user_name")]
name: String,
// 旧记录 {"username": "Alice"} → 反序列化失败
```

### PASS: 保留 alias

```rust
#[serde(rename = "user_name", alias = "username")]
name: String,
```

### FAIL: Deserialize panic

```rust
let s: String = String::deserialize(d)?;
Self(s.parse().unwrap())  // 畸形输入崩服务
```

### PASS: 返回错误

```rust
let parsed = s.parse().map_err(serde::de::Error::custom)?;
Ok(Self(parsed))
```
