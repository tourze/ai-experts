## 代码模式

- [Opaque Handle + free](references/patterns.md#模式-1)
- [CStr/CString 字符串传递](references/patterns.md#模式-2)
- [函数指针回调](references/patterns.md#模式-3)
- [uniffi Kotlin+Swift](references/patterns.md#模式-4)

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
