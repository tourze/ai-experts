---
name: react-native-jsi-bridge
description: "React Native C++ JSI 直接绑定：HostObject、CallInvoker 跨线程、ArrayBuffer 零拷贝。用户提到 JSI、HostObject、零拷贝、C++ 绑定、同步原生调用时使用。"
---

# JSI Bridge

## 适用场景

- JS 同步调 C++，不能承受 Bridge 序列化开销时。
- 零拷贝传递二进制数据时。
- 需要在 Runtime 安装全局对象，TurboModule 无法满足时。

## 核心约束

- `jsi::Runtime` 仅限 JS 线程；跨线程用 `CallInvoker::invokeAsync`。
- HostObject `get`/`set` 同步于 JS 线程，必须极快；耗时走后台线程。
- `shared_ptr` 持有暴露给 JS 的 C++ 对象，防提前析构。
- 优先 TurboModule；仅同步访问或零拷贝时才用 JSI。
- 错误抛 `jsi::JSError`，不抛 C++ 异常。
- 二进制数据用 `ArrayBuffer`，避免 Base64 开销。
- global 属性加唯一前缀（`__NativeXxx`）防冲突。

## 代码模式

按任务加载参考文件：

- [HostObject 模式](references/host-object-pattern.md)
- [CallInvoker 异步](references/call-invoker-async.md)
- [ArrayBuffer 零拷贝](references/arraybuffer-zero-copy.md)

## 检查清单

- Runtime 访问是否限于 JS 线程？跨线程是否经 CallInvoker？
- C++ 对象是否用 `shared_ptr` 持有？
- global 属性是否有唯一前缀？

## 反模式

- 后台线程直接访问 `jsi::Runtime`，竞态崩溃。
- HostObject `get` 中做 I/O，冻结 UI。
- 裸指针持有 C++ 对象，JS 访问时已析构。
- 简单异步 RPC 也用 JSI，维护成本无收益。
