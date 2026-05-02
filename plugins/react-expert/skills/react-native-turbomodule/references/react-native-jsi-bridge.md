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

### FAIL: 后台线程访问 Runtime

```cpp
std::thread([&runtime]() {
    auto result = runtime.global().getProperty(runtime, "x");
    // jsi::Runtime 仅 JS 线程访问 → 数据竞态崩溃
}).detach();
```

### PASS: CallInvoker 调度

```cpp
jsCallInvoker_->invokeAsync([&runtime, value]() {
    runtime.global().setProperty(runtime, "x", value);
});
// 切回 JS 线程后再访问
```

### FAIL: HostObject get 做 I/O

```cpp
jsi::Value MyObj::get(jsi::Runtime& rt, const jsi::PropNameID& name) {
    auto data = readFile("/large/file");  // 同步 I/O
    return jsi::String::createFromUtf8(rt, data);
}
// JS 线程冻结，UI 60fps → 5fps
```

### PASS: 异步路径

```cpp
jsi::Value MyObj::get(jsi::Runtime& rt, const jsi::PropNameID& name) {
    if (name == "loadAsync") {
        return jsi::Function::createFromHostFunction(rt, name, 0, [](...) {
            return Promise(...).then([](){ readFile(...); });  // 后台线程
        });
    }
    return jsi::Value::undefined();
}
```

### FAIL: 裸指针持有

```cpp
auto* obj = new MyObject();  // 裸指针
runtime.global().setProperty(runtime, "obj",
    jsi::Object::createFromHostObject(runtime,
        std::shared_ptr<MyObject>(obj)));  // shared_ptr 会析构
delete obj;  // double free
```

### PASS: 全程 shared_ptr

```cpp
auto obj = std::make_shared<MyObject>();
runtime.global().setProperty(runtime, "obj",
    jsi::Object::createFromHostObject(runtime, obj));
// JS 引用结束自动析构，无裸指针
```