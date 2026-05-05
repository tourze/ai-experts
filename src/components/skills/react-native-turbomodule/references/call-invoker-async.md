# CallInvoker 异步回调

## 后台线程 + CallInvoker 模式

```cpp
// cpp/AsyncWorker.h
#pragma once

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
#include <thread>
#include <memory>

using namespace facebook;

class AsyncWorker {
public:
    AsyncWorker(
        jsi::Runtime &rt,
        std::shared_ptr<react::CallInvoker> jsCallInvoker
    ) : runtime_(rt), callInvoker_(std::move(jsCallInvoker)) {}

    void fetchData(
        jsi::Runtime &rt,
        const std::string &url,
        std::shared_ptr<jsi::Function> callback
    ) {
        auto callInvoker = callInvoker_;

        std::thread([callInvoker, url, callback]() {
            // 后台线程：执行耗时 I/O
            std::string result = performNetworkRequest(url);

            // 通过 CallInvoker 回到 JS 线程
            callInvoker->invokeAsync([callback, result](jsi::Runtime &rt) {
                auto jsResult = jsi::String::createFromUtf8(rt, result);
                callback->call(rt, std::move(jsResult));
            });
        }).detach();
    }

private:
    jsi::Runtime &runtime_;
    std::shared_ptr<react::CallInvoker> callInvoker_;
};
```

## 安装时传入 CallInvoker

```cpp
void installAsyncWorker(
    jsi::Runtime &rt,
    std::shared_ptr<react::CallInvoker> callInvoker
) {
    auto worker = std::make_shared<AsyncWorker>(rt, callInvoker);

    auto fetchFn = jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "nativeFetchData"),
        2,
        [worker](jsi::Runtime &rt,
                 const jsi::Value &thisVal,
                 const jsi::Value *args,
                 size_t count) -> jsi::Value {
            auto url = args[0].asString(rt).utf8(rt);
            auto cb = std::make_shared<jsi::Function>(
                args[1].asObject(rt).asFunction(rt)
            );
            worker->fetchData(rt, url, cb);
            return jsi::Value::undefined();
        });

    rt.global().setProperty(rt, "__nativeFetchData", std::move(fetchFn));
}
```

## 关键点

- 后台线程绝不直接访问 `jsi::Runtime`；所有 Runtime 操作必须通过 `invokeAsync` 回到 JS 线程。
- `jsi::Function` 用 `std::shared_ptr` 包装后才能安全传递到 lambda 中。
- `CallInvoker` 从 TurboModule 安装流程中获取（`ReactCommon::CallInvokerHolder`）。
- `std::thread::detach()` 后注意生命周期管理，确保 `shared_ptr` 持有所有依赖。
