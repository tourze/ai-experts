# 版本协商握手

客户端发送支持的版本列表，服务端选择最高公共版本。

## 消息定义

```rust
use serde::{Deserialize, Serialize};

/// 客户端 -> 服务端
#[derive(Debug, Serialize, Deserialize)]
pub struct VersionNegotiation {
    /// 客户端支持的版本列表，降序排列
    pub supported: Vec<u32>,
    /// 客户端能力标签（同一版本内的功能开关）
    #[serde(default)]
    pub capabilities: Vec<String>,
}

/// 服务端 -> 客户端
#[derive(Debug, Serialize, Deserialize)]
pub struct VersionAck {
    /// 双方商定的版本
    pub chosen: u32,
    /// 服务端在该版本下启用的能力
    pub enabled_capabilities: Vec<String>,
}
```

## 协商逻辑

```rust
pub fn negotiate(
    client: &VersionNegotiation,
    server_supported: &[u32],
) -> Result<VersionAck, ProtocolError> {
    let chosen = client
        .supported
        .iter()
        .find(|v| server_supported.contains(v))
        .copied()
        .ok_or(ProtocolError::NoCommonVersion)?;

    let enabled = client
        .capabilities
        .iter()
        .filter(|cap| is_capability_supported(chosen, cap))
        .cloned()
        .collect();

    Ok(VersionAck {
        chosen,
        enabled_capabilities: enabled,
    })
}

fn is_capability_supported(version: u32, capability: &str) -> bool {
    match (version, capability) {
        (v, "compression") if v >= 2 => true,
        (v, "multiplexing") if v >= 3 => true,
        (v, "zero-rtt") if v >= 4 => true,
        _ => false,
    }
}
```

## 协商时序

```
客户端                              服务端
  |                                   |
  |-- VersionNegotiation ----------> |
  |   {supported: [4,3,2], caps: ..} |
  |                                   |
  |  <---------- VersionAck -------- |
  |   {chosen: 3, enabled: [..]}      |
  |                                   |
  |-- Envelope(v=3, ...) ----------> |
  |   后续消息均使用协商后的版本        |
```

## 要点

- 客户端发送降序版本列表，服务端取最高公共版本。
- 能力标签独立于版本号，允许同一版本内的功能灰度。
- 无公共版本时返回明确错误，不尝试降级到未声明版本。
- 协商完成后，后续所有消息使用商定版本的信封格式。
