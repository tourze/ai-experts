# Rust Serde Patterns - 代码模式

## 模式 1

### Internally Tagged Enum

依赖：`serde = { version = "1", features = ["derive"] }`，`serde_json = "1"`

```rust
use serde::{Deserialize, Serialize};

/// Protocol messages identified by an internal "type" tag.
/// JSON example: {"type": "subscribe", "channel": "orders"}
#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Message {
    Subscribe {
        channel: String,
    },
    Unsubscribe {
        channel: String,
    },
    Publish {
        channel: String,
        payload: serde_json::Value,
    },
    Ping,
    Pong,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_subscribe() {
        let msg = Message::Subscribe {
            channel: "orders".into(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains(r#""type":"subscribe""#));

        let parsed: Message = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, msg);
    }

    #[test]
    fn deserialize_ping() {
        let json = r#"{"type": "ping"}"#;
        let msg: Message = serde_json::from_str(json).unwrap();
        assert_eq!(msg, Message::Ping);
    }
}
```

## 模式 2

### 向后兼容的结构体演进

依赖：`serde = { version = "1", features = ["derive"] }`，`serde_json = "1"`

```rust
use serde::{Deserialize, Serialize};

/// V1 data may have "user_name" instead of "username",
/// and may lack the "role" field entirely.
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct UserProfile {
    /// Accept both "username" and the legacy "user_name" key.
    #[serde(alias = "user_name")]
    pub username: String,

    pub email: String,

    /// New in v2: absent in v1 data, defaults to "viewer".
    #[serde(default = "default_role")]
    pub role: String,

    /// New in v3: truly optional, absent in older data.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,

    /// Deprecated: kept for deserialization only, never serialized.
    #[serde(default, skip_serializing)]
    pub legacy_id: Option<u64>,
}

fn default_role() -> String {
    "viewer".into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn v1_data_deserializes() {
        let v1 = r#"{
            "user_name": "alice",
            "email": "alice@example.com",
            "legacy_id": 42
        }"#;

        let profile: UserProfile = serde_json::from_str(v1).unwrap();
        assert_eq!(profile.username, "alice");
        assert_eq!(profile.role, "viewer"); // default applied
        assert_eq!(profile.legacy_id, Some(42));
    }

    #[test]
    fn v3_data_round_trips() {
        let profile = UserProfile {
            username: "bob".into(),
            email: "bob@example.com".into(),
            role: "admin".into(),
            avatar_url: Some("https://img.example.com/bob.png".into()),
            legacy_id: None,
        };

        let json = serde_json::to_string(&profile).unwrap();
        // legacy_id is skip_serializing, should not appear
        assert!(!json.contains("legacy_id"));

        let parsed: UserProfile = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.username, "bob");
    }
}
```

## 模式 3

### 自定义序列化：Duration 转毫秒

依赖：`serde = { version = "1", features = ["derive"] }`，`serde_json = "1"`

```rust
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Serialize Duration as integer milliseconds for JSON APIs.
mod duration_millis {
    use serde::{self, Deserialize, Deserializer, Serializer};
    use std::time::Duration;

    pub fn serialize<S>(duration: &Duration, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u64(duration.as_millis() as u64)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let millis = u64::deserialize(deserializer)?;
        Ok(Duration::from_millis(millis))
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct RetryConfig {
    pub max_retries: u32,
    #[serde(with = "duration_millis")]
    pub base_delay: Duration,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn duration_as_millis_round_trip() {
        let config = RetryConfig {
            max_retries: 3,
            base_delay: Duration::from_millis(500),
        };
        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains(r#""base_delay":500"#));
        let parsed: RetryConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, config);
    }
}
```

## 模式 4

### 反序列化时校验

依赖：`serde = { version = "1", features = ["derive"] }`，`serde_json = "1"`

```rust
use serde::Deserialize;
use std::fmt;

/// A port number that is validated during deserialization.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(u16);

impl Port {
    pub fn new(value: u16) -> Result<Self, PortError> {
        if value == 0 {
            return Err(PortError::Zero);
        }
        Ok(Self(value))
    }

    pub fn value(self) -> u16 {
        self.0
    }
}

#[derive(Debug)]
pub enum PortError {
    Zero,
}

impl fmt::Display for PortError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Zero => write!(f, "port must not be zero"),
        }
    }
}

impl serde::Serialize for Port {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u16(self.0)
    }
}

impl<'de> Deserialize<'de> for Port {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let raw = u16::deserialize(deserializer)?;
        Port::new(raw).map_err(|e| serde::de::Error::custom(e))
    }
}

#[derive(Debug, Deserialize, serde::Serialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: Port,

    #[serde(default = "default_max_connections")]
    pub max_connections: u32,
}

fn default_max_connections() -> u32 {
    1024
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_config() {
        let json = r#"{"host": "0.0.0.0", "port": 8080}"#;
        let config: ServerConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.port.value(), 8080);
        assert_eq!(config.max_connections, 1024); // default
    }

    #[test]
    fn port_zero_rejected() {
        let json = r#"{"host": "0.0.0.0", "port": 0}"#;
        let err = serde_json::from_str::<ServerConfig>(json).unwrap_err();
        assert!(err.to_string().contains("port must not be zero"));
    }
}
```
