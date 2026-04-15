# 版本化消息信封（Rust + serde）

每条消息用信封包裹，携带版本号，实现前向兼容反序列化。

## 信封结构

```rust
use serde::{Deserialize, Serialize};

/// 所有协议消息的外层信封
#[derive(Debug, Serialize, Deserialize)]
pub struct Envelope {
    /// 协议版本，单调递增
    pub version: u32,
    /// 消息类型标识
    pub msg_type: String,
    /// 实际负载，延迟反序列化
    pub payload: serde_json::Value,
    /// 扩展字段 — 初始设计时预留，旧版本忽略
    #[serde(default)]
    pub extensions: std::collections::HashMap<String, serde_json::Value>,
}

/// v1 握手请求
#[derive(Debug, Serialize, Deserialize)]
pub struct HandshakeRequest {
    pub client_id: String,
    pub supported_versions: Vec<u32>,
    /// v2 新增：客户端能力列表（旧服务端不识别会忽略）
    #[serde(default)]
    pub capabilities: Vec<String>,
}
```

## 安全解析负载

```rust
impl Envelope {
    /// 版本不匹配时返回错误而非 panic
    pub fn decode_payload<T: serde::de::DeserializeOwned>(
        &self,
        expected_min_version: u32,
    ) -> Result<T, ProtocolError> {
        if self.version < expected_min_version {
            return Err(ProtocolError::VersionTooOld {
                got: self.version,
                min: expected_min_version,
            });
        }
        serde_json::from_value(self.payload.clone())
            .map_err(|e| ProtocolError::DeserializeFailed(e.to_string()))
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ProtocolError {
    #[error("协议版本过旧: 收到 v{got}，最低要求 v{min}")]
    VersionTooOld { got: u32, min: u32 },
    #[error("反序列化失败: {0}")]
    DeserializeFailed(String),
    #[error("版本协商失败: 无公共版本")]
    NoCommonVersion,
}
```

## 要点

- `payload` 使用 `serde_json::Value` 延迟反序列化，信封层不需要知道具体消息类型。
- `extensions` map 在 v1 就预留，旧版本通过 `#[serde(default)]` 安全忽略。
- 版本检查在解析负载前完成，避免对不兼容版本做无意义反序列化。
