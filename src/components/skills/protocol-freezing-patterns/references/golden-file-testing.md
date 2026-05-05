# Golden File 测试 — 永远不让旧数据坏掉

保存每个版本的序列化字节，新代码必须能正确反序列化。

## 测试实现

```rust
#[cfg(test)]
mod tests {
    use super::*;

    const GOLDEN_DIR: &str = "tests/golden/session_config";

    #[test]
    fn deserialize_all_golden_versions() {
        let entries = std::fs::read_dir(GOLDEN_DIR)
            .expect("golden 目录不存在");

        for entry in entries {
            let path = entry.unwrap().path();
            if path.extension().map_or(true, |e| e != "json") {
                continue;
            }

            let bytes = std::fs::read(&path).unwrap();
            let filename = path.file_name().unwrap().to_string_lossy();

            let result: Result<SessionConfig, _> = serde_json::from_slice(&bytes);
            assert!(
                result.is_ok(),
                "Golden file {filename} 反序列化失败: {:?}",
                result.err()
            );

            let config = result.unwrap();
            assert!(config.keepalive_ms > 0, "{filename}: keepalive_ms 必须 > 0");
        }
    }

    #[test]
    fn golden_v1_timeout_ms_alias() {
        // v1 使用旧字段名 "timeout_ms"，当前代码通过 alias 兼容
        let v1_json = r#"{
            "timeout_ms": 30000,
            "encryption": "aes256_gcm"
        }"#;

        let config: SessionConfig = serde_json::from_str(v1_json).unwrap();
        assert_eq!(config.keepalive_ms, 30000);
        assert!(config.compression.is_none());
    }

    #[test]
    fn golden_v2_with_compression() {
        let v2_json = r#"{
            "timeout_ms": 15000,
            "encryption": "chacha20_poly1305",
            "compression": "zstd"
        }"#;

        let config: SessionConfig = serde_json::from_str(v2_json).unwrap();
        assert_eq!(config.keepalive_ms, 15000);
        assert!(matches!(config.compression, Some(CompressionMode::Zstd)));
    }

    #[test]
    fn unknown_fields_are_ignored() {
        // 未来版本可能追加新字段，旧代码必须忽略
        let future_json = r#"{
            "keepalive_ms": 10000,
            "encryption": "aes256_gcm",
            "some_future_field": true,
            "another_future_field": [1, 2, 3]
        }"#;

        let config: SessionConfig = serde_json::from_str(future_json).unwrap();
        assert_eq!(config.keepalive_ms, 10000);
    }

    /// 生成当前版本的 golden file（仅开发时手动运行一次）
    #[test]
    #[ignore]
    fn generate_golden_file() {
        let config = SessionConfig {
            keepalive_ms: 20000,
            encryption: EncryptionMode::Aes256Gcm,
            compression: Some(CompressionMode::Lz4),
            legacy_mode: None,
            extra: Default::default(),
        };

        let json = serde_json::to_string_pretty(&config).unwrap();
        let version = env!("CARGO_PKG_VERSION");
        let path = format!("{GOLDEN_DIR}/v{version}.json");
        std::fs::write(&path, json).unwrap();
        eprintln!("已生成 golden file: {path}");
    }
}
```

## Golden file 目录结构

```
tests/golden/session_config/
├── v1.0.0.json    # 只有 timeout_ms + encryption
├── v1.1.0.json    # 新增 compression
├── v1.2.0.json    # 重命名为 keepalive_ms
└── v1.3.0.json    # 新增 extra map
```

## 要点

- Golden file 一旦生成永远不修改，只追加新版本。
- CI 每次运行都遍历所有历史 golden file，确保向后兼容。
- 生成器测试标记 `#[ignore]`，仅在发布新版本时手动运行。
- 同时测试旧字段名（alias）、可选字段缺失、未知字段忽略三种场景。
