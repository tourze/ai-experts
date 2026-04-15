# ArrayBuffer 零拷贝二进制数据

## 自定义 MutableBuffer

```cpp
// cpp/ImageBuffer.h
#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <cstring>

using namespace facebook;

class ImageMutableBuffer : public jsi::MutableBuffer {
public:
    ImageMutableBuffer(std::vector<uint8_t> data)
        : data_(std::move(data)) {}

    uint8_t *data() override { return data_.data(); }
    size_t size() const override { return data_.size(); }

private:
    std::vector<uint8_t> data_;
};
```

## 暴露给 JS

```cpp
jsi::Value getImageBuffer(
    jsi::Runtime &rt,
    const jsi::Value *args,
    size_t count
) {
    std::vector<uint8_t> imageData = loadImageFromDisk("photo.raw");

    // 零拷贝：std::move 直接转移所有权到 ArrayBuffer
    auto buffer = std::make_shared<ImageMutableBuffer>(
        std::move(imageData)
    );
    return jsi::ArrayBuffer(rt, std::move(buffer));
}

void installImageBuffer(jsi::Runtime &rt) {
    auto fn = jsi::Function::createFromHostFunction(
        rt,
        jsi::PropNameID::forAscii(rt, "__getImageBuffer"),
        0,
        [](jsi::Runtime &rt,
           const jsi::Value &thisVal,
           const jsi::Value *args,
           size_t count) -> jsi::Value {
            return getImageBuffer(rt, args, count);
        });
    rt.global().setProperty(rt, "__getImageBuffer", std::move(fn));
}
```

## JS 消费端

```typescript
declare global {
  var __getImageBuffer: () => ArrayBuffer;
}

export function getImageAsUint8Array(): Uint8Array {
  const buffer = global.__getImageBuffer();
  return new Uint8Array(buffer);
}
```

## 适用场景

| 方式 | 适合 | 开销 |
|---|---|---|
| ArrayBuffer | 图像、音频、加密结果等大块二进制 | 零拷贝，O(1) |
| Base64 字符串 | 小数据（<1KB）或兼容旧 Bridge | 编解码 + 2x 内存 |
| JSON 数组 | 结构化数据 | 序列化 + GC 压力 |

## 关键点

- `std::move` 转移 vector 所有权，避免拷贝。
- `MutableBuffer` 的生命周期由 `shared_ptr` 管理，JS 侧 GC 回收时自动释放 C++ 内存。
- 大于 1KB 的二进制数据始终优先 ArrayBuffer，避免 Base64 的 33% 体积膨胀和编解码开销。
