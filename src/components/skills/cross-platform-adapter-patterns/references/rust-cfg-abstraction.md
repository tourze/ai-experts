# Rust trait 平台抽象 + 编译时选择

利用 `#[cfg]` 在编译时选择平台实现，零运行时开销。

## 共享 trait 定义

```rust
// crates/shared-core/src/clipboard.rs
pub trait Clipboard: Send + Sync {
    fn read_text(&self) -> Result<String, PlatformError>;
    fn write_text(&self, text: &str) -> Result<(), PlatformError>;
}

#[derive(Debug, thiserror::Error)]
pub enum PlatformError {
    #[error("该平台不支持此功能")]
    Unsupported,
    #[error("权限不足: {0}")]
    PermissionDenied(String),
    #[error("平台调用失败: {0}")]
    Native(String),
}
```

## 平台实现

```rust
// crates/platform-macos/src/clipboard.rs
#[cfg(target_os = "macos")]
pub struct MacClipboard;

#[cfg(target_os = "macos")]
impl Clipboard for MacClipboard {
    fn read_text(&self) -> Result<String, PlatformError> {
        objc_read_pasteboard()
    }
    fn write_text(&self, text: &str) -> Result<(), PlatformError> {
        objc_write_pasteboard(text)
    }
}

// crates/platform-linux/src/clipboard.rs
#[cfg(target_os = "linux")]
pub struct LinuxClipboard;

#[cfg(target_os = "linux")]
impl Clipboard for LinuxClipboard {
    fn read_text(&self) -> Result<String, PlatformError> {
        x11_read_clipboard()
    }
    fn write_text(&self, text: &str) -> Result<(), PlatformError> {
        x11_write_clipboard(text)
    }
}
```

## 编译时工厂

```rust
// crates/shared-core/src/lib.rs
pub fn create_clipboard() -> Box<dyn Clipboard> {
    #[cfg(target_os = "macos")]
    { Box::new(platform_macos::MacClipboard) }
    #[cfg(target_os = "linux")]
    { Box::new(platform_linux::LinuxClipboard) }
    #[cfg(target_os = "windows")]
    { Box::new(platform_windows::WinClipboard) }
}
```

## 要点

- trait 定义在共享 crate 中，平台 crate 各自实现。
- `#[cfg]` 在编译时消除不活跃平台代码，无运行时判断。
- 工厂函数返回 `Box<dyn Trait>`，调用方无需知道具体类型。
- `PlatformError` 枚举统一错误语义，不泄漏平台 FFI 细节。
