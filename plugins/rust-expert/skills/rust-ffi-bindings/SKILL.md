---
name: rust-ffi-bindings
description: 当用户需要通过 FFI 集成 Rust 与 C/C++ 或其他语言时使用；涉及 extern C、#[no_mangle]、CStr/CString 或 opaque pointer 时触发。
---

# Rust FFI Bindings

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

- 忘 `#[no_mangle]`：链接找不到符号。
- 传 `String`/`Vec<u8>` 跨 FFI：外部无法理解胖指针。
- 不包 `catch_unwind` 就 `unwrap()`：panic 即 UB。
- 只 `_new` 无 `_free`：必然泄漏。
