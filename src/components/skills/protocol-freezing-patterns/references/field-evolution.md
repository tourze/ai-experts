# 字段演进 — 可选字段 + 别名 + 默认值

在不破坏旧数据的前提下重命名字段、新增字段、废弃字段。

## 演进示例

```rust
use serde::{Deserialize, Serialize};

/// 会话配置消息
/// 字段演进历史:
///   v1: 初始版本，包含 timeout_ms, encryption
///   v2: 新增 compression (可选，默认 None)
///   v3: 重命名 timeout_ms -> keepalive_ms (alias 保留旧名兼容)
///   v4: 废弃 legacy_mode (仍可反序列化，但写入时不再输出)
#[derive(Debug, Serialize, Deserialize)]
pub struct SessionConfig {
    /// v3 重命名：旧客户端发 "timeout_ms"，新客户端发 "keepalive_ms"
    #[serde(alias = "timeout_ms")]
    pub keepalive_ms: u64,

    pub encryption: EncryptionMode,

    /// v2 新增：旧消息中不存在时默认 None
    #[serde(default)]
    pub compression: Option<CompressionMode>,

    /// v4 废弃：仍能反序列化旧消息，但序列化时跳过
    #[serde(default, skip_serializing)]
    pub legacy_mode: Option<bool>,

    /// 预留扩展：未来版本的字段可以先放这里试验
    #[serde(default, skip_serializing_if = "std::collections::HashMap::is_empty")]
    pub extra: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EncryptionMode {
    None,
    Aes256Gcm,
    ChaCha20Poly1305,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CompressionMode {
    Lz4,
    Zstd,
}
```

## 字段废弃四阶段流程

```
阶段 1 — 标记废弃    : #[deprecated] + 文档说明，读写均正常
阶段 2 — 停止写入    : #[serde(skip_serializing)]，仍可读旧数据
阶段 3 — 停止读取    : 反序列化时忽略该字段，日志记录遗留数据量
阶段 4 — 移除定义    : 从结构体中删除，确认零旧数据后执行
```

## serde 属性速查

| 需求 | 属性 |
|---|---|
| 新增可选字段 | `#[serde(default)]` |
| 字段重命名保留旧名 | `#[serde(alias = "old_name")]` |
| 废弃字段停止写入 | `#[serde(skip_serializing)]` |
| 扩展 map 不序列化空值 | `#[serde(skip_serializing_if = "HashMap::is_empty")]` |
| 枚举用字符串 | `#[serde(rename_all = "snake_case")]` |

## 要点

- 用 `alias` 做重命名，旧名字永远可读。
- 用 `default` 做新增，旧消息缺失字段时自动填充默认值。
- 枚举必须用字符串序列化，避免插入新变体导致数字错位。
- `extra` map 是安全的扩展出口，但不应替代正式字段定义。
