## 适用场景

- 将 Rust 库暴露给 C/Swift/Kotlin/Python 调用。
- 设计跨 FFI 的字符串、错误码、回调或复杂类型方案。
- 排查 FFI 段错误、double-free 或 panic 跨边界 UB。

## 核心约束

1. FFI 函数必须 `#[no_mangle]` + `extern "C"`。
2. 字符串只用 `*const c_char` / `*mut c_char`。
3. 每函数文档注明内存所有权。
4. 每个 `Box::into_raw` 配对 `_free`，`_free` 处理 null。
5. 每个入口 `catch_unwind`；panic 跨 FFI 是 UB。
6. 复杂类型用 opaque pointer，暴露的结构体 `#[repr(C)]`。
7. 用 cbindgen / uniffi 生成绑定，禁手写头文件。

## 代码模式

- [Opaque Handle + free](references/patterns.md#模式-1)
- [CStr/CString 字符串传递](references/patterns.md#模式-2)
- [函数指针回调](references/patterns.md#模式-3)
- [uniffi Kotlin+Swift](references/patterns.md#模式-4)

## 检查清单

- `extern "C"` 都有 `#[no_mangle]`？入口都有 `catch_unwind`？
- `Box::into_raw` 都有配对 `_free`？`#[repr(C)]` 无遗漏？

## 反模式

### FAIL: 传 String 跨 FFI

```rust
#[no_mangle]
pub extern "C" fn greet(name: String) -> String {
    format!("Hello, {}", name)
}
// String 是 Rust (ptr, len, cap) 三字段胖指针，C 端无法理解
```

### PASS: CString + 显式所有权

```rust
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

#[no_mangle]
pub extern "C" fn greet(name: *const c_char) -> *mut c_char {
    let n = unsafe { CStr::from_ptr(name) }.to_str().unwrap_or("");
    CString::new(format!("Hello, {}", n)).unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn greet_free(s: *mut c_char) {
    if s.is_null() { return; }
    unsafe { drop(CString::from_raw(s)); }
}
```

### FAIL: 跨 FFI panic

```rust
#[no_mangle]
pub extern "C" fn divide(a: i32, b: i32) -> i32 {
    a / b  // b=0 panic → 跨 FFI 边界 = UB
}
```

### PASS: catch_unwind + 错误码

```rust
use std::panic::catch_unwind;

#[no_mangle]
pub extern "C" fn divide(a: i32, b: i32, out: *mut i32) -> i32 {
    match catch_unwind(|| if b == 0 { Err(()) } else { Ok(a / b) }) {
        Ok(Ok(v)) => { unsafe { *out = v; } 0 }
        _ => -1,
    }
}
```

### FAIL: _new 无 _free

```rust
#[no_mangle]
pub extern "C" fn parser_new() -> *mut Parser {
    Box::into_raw(Box::new(Parser::new()))
}
// 缺 parser_free → 每次调用泄漏
```

### PASS: 配对释放

```rust
#[no_mangle]
pub extern "C" fn parser_free(p: *mut Parser) {
    if p.is_null() { return; }
    unsafe { drop(Box::from_raw(p)); }
}
```
