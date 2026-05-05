# Rust FFI Bindings - 代码模式

## 模式 1

### Opaque Handle 导出与释放

依赖：无额外 crate，仅使用标准库。

```rust
use std::ffi::c_char;
use std::panic::catch_unwind;

/// Opaque handle exposed to C callers.
pub struct Engine {
    name: String,
    counter: u64,
}

/// Create a new Engine. Caller owns the returned pointer
/// and must free it with `engine_free`.
#[no_mangle]
pub extern "C" fn engine_new() -> *mut Engine {
    let engine = Engine {
        name: String::from("default"),
        counter: 0,
    };
    Box::into_raw(Box::new(engine))
}

/// Increment the engine counter. Returns -1 on null pointer or panic.
#[no_mangle]
pub extern "C" fn engine_increment(ptr: *mut Engine) -> i64 {
    let result = catch_unwind(|| {
        if ptr.is_null() {
            return -1;
        }
        let engine = unsafe { &mut *ptr };
        engine.counter += 1;
        engine.counter as i64
    });
    result.unwrap_or(-1)
}

/// Free an Engine previously created by `engine_new`.
/// Safe to call with null.
#[no_mangle]
pub extern "C" fn engine_free(ptr: *mut Engine) {
    if !ptr.is_null() {
        unsafe {
            drop(Box::from_raw(ptr));
        }
    }
}
```

## 模式 2

### CStr/CString 跨边界传递

依赖：无额外 crate，仅使用标准库。

```rust
use std::ffi::{c_char, CStr, CString};
use std::panic::catch_unwind;
use std::ptr;

/// Accept a C string, process it in Rust, return a new C string.
/// Caller must free the returned string with `string_free`.
#[no_mangle]
pub extern "C" fn greet(name: *const c_char) -> *mut c_char {
    let result = catch_unwind(|| {
        if name.is_null() {
            return ptr::null_mut();
        }
        let c_str = unsafe { CStr::from_ptr(name) };
        let name_str = match c_str.to_str() {
            Ok(s) => s,
            Err(_) => return ptr::null_mut(),
        };
        let greeting = format!("Hello, {name_str}!");
        match CString::new(greeting) {
            Ok(cs) => cs.into_raw(),
            Err(_) => ptr::null_mut(),
        }
    });
    result.unwrap_or(ptr::null_mut())
}

/// Free a string previously returned by Rust FFI functions.
/// Safe to call with null.
#[no_mangle]
pub extern "C" fn string_free(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe {
            drop(CString::from_raw(ptr));
        }
    }
}

/// Fill a caller-allocated buffer. Returns the number of bytes
/// written (excluding null terminator), or -1 on error.
#[no_mangle]
pub extern "C" fn get_version(buf: *mut c_char, buf_len: usize) -> i32 {
    let result = catch_unwind(|| {
        if buf.is_null() || buf_len == 0 {
            return -1;
        }
        let version = b"1.2.3\0";
        if buf_len < version.len() {
            return -1;
        }
        unsafe {
            ptr::copy_nonoverlapping(version.as_ptr(), buf as *mut u8, version.len());
        }
        (version.len() - 1) as i32 // exclude null terminator
    });
    result.unwrap_or(-1)
}
```

## 模式 3

### 函数指针回调

依赖：无额外 crate，仅使用标准库。

```rust
use std::panic::catch_unwind;

/// Callback type: C caller provides a function to receive progress.
/// `progress` is 0..=100, `user_data` is an opaque context pointer.
pub type ProgressCallback =
    Option<extern "C" fn(progress: u32, user_data: *mut std::ffi::c_void)>;

/// Run a long operation, reporting progress via callback.
/// Returns 0 on success, -1 on error.
#[no_mangle]
pub extern "C" fn process_data(
    data_ptr: *const u8,
    data_len: usize,
    on_progress: ProgressCallback,
    user_data: *mut std::ffi::c_void,
) -> i32 {
    let result = catch_unwind(|| {
        if data_ptr.is_null() || data_len == 0 {
            return -1;
        }
        let data = unsafe { std::slice::from_raw_parts(data_ptr, data_len) };
        let total = data.len();

        for (i, _byte) in data.iter().enumerate() {
            // ... actual processing ...
            if let Some(cb) = on_progress {
                let pct = ((i + 1) * 100 / total) as u32;
                cb(pct, user_data);
            }
        }
        0
    });
    result.unwrap_or(-1)
}

/// C-compatible struct passed through user_data.
#[repr(C)]
pub struct ProcessContext {
    pub last_progress: u32,
    pub cancelled: bool,
}

/// Callback that updates context.
pub extern "C" fn example_progress_handler(
    progress: u32,
    user_data: *mut std::ffi::c_void,
) {
    if user_data.is_null() {
        return;
    }
    let ctx = unsafe { &mut *(user_data as *mut ProcessContext) };
    ctx.last_progress = progress;
}
```

## 模式 4

### uniffi 生成 Kotlin+Swift 绑定

依赖：`uniffi = { version = "0.28", features = ["cli"] }`，`thiserror = "2"`

```rust
// src/lib.rs
uniffi::setup_scaffolding!();

/// A configuration object exposed to Kotlin/Swift.
#[derive(uniffi::Record)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub use_tls: bool,
}

/// Error type visible in foreign languages as a sealed class / enum.
#[derive(Debug, thiserror::Error, uniffi::Error)]
pub enum ClientError {
    #[error("connection failed: {reason}")]
    ConnectionFailed { reason: String },
    #[error("timeout after {ms} ms")]
    Timeout { ms: u64 },
}

/// A stateful client exposed as an opaque object with methods.
#[derive(uniffi::Object)]
pub struct Client {
    config: Config,
    connected: std::sync::Mutex<bool>,
}

#[uniffi::export]
impl Client {
    /// Constructor callable from Kotlin/Swift as `Client(config)`.
    #[uniffi::constructor]
    pub fn new(config: Config) -> Self {
        Self {
            config,
            connected: std::sync::Mutex::new(false),
        }
    }

    /// Connect to the remote server.
    pub fn connect(&self) -> Result<(), ClientError> {
        let mut guard = self.connected.lock().unwrap();
        if self.config.host.is_empty() {
            return Err(ClientError::ConnectionFailed {
                reason: "empty host".into(),
            });
        }
        *guard = true;
        Ok(())
    }

    /// Check connection status.
    pub fn is_connected(&self) -> bool {
        *self.connected.lock().unwrap()
    }
}

/// Free function exposed to foreign languages.
#[uniffi::export]
pub fn default_config() -> Config {
    Config {
        host: "localhost".into(),
        port: 8080,
        use_tls: false,
    }
}
```

对应 `uniffi.toml`：

```toml
[bindings.kotlin]
package_name = "com.example.client"

[bindings.swift]
module_name = "ExampleClient"
```
