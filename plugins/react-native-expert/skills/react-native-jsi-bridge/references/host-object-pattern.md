# HostObject 挂载到 global

## C++ HostObject 实现

```cpp
// cpp/CryptoHostObject.h
#pragma once

#include <jsi/jsi.h>
#include <string>
#include <vector>

using namespace facebook;

class CryptoHostObject : public jsi::HostObject {
public:
    CryptoHostObject() = default;

    jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name) override {
        auto methodName = name.utf8(rt);

        if (methodName == "sha256") {
            return jsi::Function::createFromHostFunction(
                rt,
                jsi::PropNameID::forAscii(rt, "sha256"),
                1,
                [](jsi::Runtime &rt,
                   const jsi::Value &thisVal,
                   const jsi::Value *args,
                   size_t count) -> jsi::Value {
                    if (count < 1 || !args[0].isString()) {
                        throw jsi::JSError(rt, "sha256 expects a string argument");
                    }
                    auto input = args[0].asString(rt).utf8(rt);
                    std::string hash = computeSha256(input);
                    return jsi::String::createFromUtf8(rt, hash);
                });
        }

        if (methodName == "randomBytes") {
            return jsi::Function::createFromHostFunction(
                rt,
                jsi::PropNameID::forAscii(rt, "randomBytes"),
                1,
                [](jsi::Runtime &rt,
                   const jsi::Value &thisVal,
                   const jsi::Value *args,
                   size_t count) -> jsi::Value {
                    int size = static_cast<int>(args[0].asNumber());
                    auto array = jsi::Array(rt, size);
                    for (int i = 0; i < size; i++) {
                        array.setValueAtIndex(rt, i, jsi::Value(rand() % 256));
                    }
                    return array;
                });
        }

        return jsi::Value::undefined();
    }

    void set(jsi::Runtime &rt, const jsi::PropNameID &name,
             const jsi::Value &value) override {
        throw jsi::JSError(rt, "CryptoHostObject is read-only");
    }
};

void installCrypto(jsi::Runtime &rt) {
    auto cryptoObj = std::make_shared<CryptoHostObject>();
    auto jsiObj = jsi::Object::createFromHostObject(rt, cryptoObj);
    rt.global().setProperty(rt, "__NativeCrypto", std::move(jsiObj));
}
```

## JS 消费端

```typescript
declare global {
  var __NativeCrypto: {
    sha256(input: string): string;
    randomBytes(size: number): number[];
  };
}

export function sha256(input: string): string {
  if (!global.__NativeCrypto) {
    throw new Error('NativeCrypto JSI module not installed');
  }
  return global.__NativeCrypto.sha256(input);
}
```

## 关键点

- `std::shared_ptr<CryptoHostObject>` 防止 JS 持有引用时 C++ 对象被析构。
- `get` 方法每次被调用都返回新 Function；对于热路径可缓存到 map。
- global 属性名加 `__Native` 前缀，避免与 Web 标准或第三方库冲突。
- 错误一律用 `jsi::JSError`，JS 的 try-catch 才能正确捕获。
