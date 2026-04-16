---
name: memory-safety-patterns
description: "在编写或评审 C/C++ 系统代码、梳理资源所有权或修复内存安全问题时使用。"
---

## 适用场景

- 你在 C/C++ 里申请或持有资源：`FILE*`、socket、锁、堆内存、线程句柄、`new` 出来的对象。
- 你在改老代码，想把“谁负责释放”从口头约定变成编译期约束。
- 你在排查泄漏、双重释放、悬空指针、异常路径资源遗失。
- 你在设计 C API / C++ 封装边界，需要明确 owning pointer、observer pointer、borrowed view。
- 你在评审代码，怀疑 `shared_ptr`、裸指针或 cleanup 路径已经失控。

## 核心约束

- 一个资源只能有一个清晰 owner。`shared_ptr` 不是“想不清楚时的默认答案”。
- 裸指针默认视为 observer，不承担释放责任；表达所有权时优先 `std::unique_ptr`。
- 资源获取和释放必须同层封装。谁 `open/create/alloc`，谁定义对应的析构或 cleanup 语义。
- C++ 代码默认要求异常安全：构造成功即建立不变量，析构不抛异常。
- C 代码不能把 cleanup 分支散落在多个 `return`；统一走 `goto cleanup` 或单出口销毁函数。
- 当一个接口只读不拥有数据时，传 `std::span` / `std::string_view` / `const T&`，不要传拥有型容器副本。

## 代码模式

### 模式 1：用 RAII 包住 C 资源，而不是手写成对 `open/close`

```cpp
#include <cstdio>
#include <memory>
#include <stdexcept>
#include <string_view>

class FileWriter {
public:
    explicit FileWriter(const char* path)
        : file_(std::fopen(path, "w"), &std::fclose) {
        if (!file_) {
            throw std::runtime_error("fopen failed");
        }
    }

    void write(std::string_view text) const {
        const auto written = std::fwrite(text.data(), 1, text.size(), file_.get());
        if (written != text.size()) {
            throw std::runtime_error("fwrite failed");
        }
    }

private:
    std::unique_ptr<FILE, int (*)(FILE*)> file_;
};
```

结论：资源生命周期跟对象作用域绑定，异常路径也不会漏掉 `fclose`。

### 模式 2：只借用就显式借用，不把 ownership 混进函数签名

```cpp
#include <span>
#include <vector>

int sum(std::span<const int> values) {
    int total = 0;
    for (int value : values) {
        total += value;
    }
    return total;
}

int main() {
    std::vector<int> values{1, 2, 3, 4};
    return sum(values) == 10 ? 0 : 1;
}
```

结论：接口表达的是“读一段连续数据”，不是“接管一个 `std::vector`”。

### 模式 3：必须共享所有权时，用 `weak_ptr` 明确打断环

```cpp
#include <memory>

struct Node {
    std::weak_ptr<Node> parent;
    std::shared_ptr<Node> child;
};

std::shared_ptr<Node> build_tree() {
    auto root = std::make_shared<Node>();
    auto leaf = std::make_shared<Node>();
    root->child = leaf;
    leaf->parent = root;
    return root;
}
```

规则：树、图、回调链路里只允许一个方向持有 `shared_ptr`；反向边必须降成 `weak_ptr`。

### 模式 4：C 代码统一走单出口 cleanup，别把释放逻辑复制到每个分支

```c
#include <stdio.h>
#include <stdlib.h>

int load_text(const char* path, char** out_buffer) {
    FILE* fp = NULL;
    char* buffer = NULL;
    long size = 0;
    int rc = -1;

    *out_buffer = NULL;

    fp = fopen(path, "rb");
    if (fp == NULL) goto cleanup;

    if (fseek(fp, 0, SEEK_END) != 0) goto cleanup;
    size = ftell(fp);
    if (size < 0) goto cleanup;
    rewind(fp);

    buffer = malloc((size_t)size + 1U);
    if (buffer == NULL) goto cleanup;

    if (fread(buffer, 1, (size_t)size, fp) != (size_t)size) goto cleanup;
    buffer[size] = 0;

    *out_buffer = buffer;
    buffer = NULL;
    rc = 0;

cleanup:
    free(buffer);
    if (fp != NULL) fclose(fp);
    return rc;
}
```

规则：C 边界里最危险的不是主路径，而是第 2、3、4 个失败分支。

### 模式 5：用 Rust 所有权模型校对 C++ 设计是否说得清

```rust
fn first_word(input: &str) -> &str {
    input.split_whitespace().next().unwrap_or("")
}

fn append_suffix(value: &mut String) {
    value.push_str("_done");
}

fn main() {
    let mut text = String::from("hello world");
    let head = first_word(&text);
    assert_eq!(head, "hello");
    append_suffix(&mut text);
    assert_eq!(text, "hello world_done");
}
```

用法：如果一段 C++ 接口很难说清“谁拥有、谁借用、谁可写”，先拿 Rust 语义翻译一次，接口问题通常会自己暴露。

## 检查清单

- 每个资源是否都能回答“谁创建、谁释放、何时释放”。
- 是否优先使用了 `std::unique_ptr`、栈对象、`std::lock_guard` 这类单 owner 结构。
- `shared_ptr` 是否真的是多方长期持有，而不是为了省事。
- 反向引用、观察者、缓存指针是否降成了 `weak_ptr`、裸指针或 `std::reference_wrapper`。
- 接口签名是否把 ownership 和 borrowing 区分清楚了。
- C 代码是否只有一个 cleanup 出口，并覆盖所有失败分支。
- 析构函数是否保证不抛异常；移动后对象是否仍处于可析构状态。
- 是否避免返回指向局部对象、临时缓冲区或失效容器元素的指针 / 引用。

## 反模式

### FAIL: shared_ptr 当默认答案

```cpp
class Engine {
    std::shared_ptr<Logger> logger_;  // 真需要共享？
    std::shared_ptr<Config> config_;  // 谁释放说不清
};
```

### PASS: 单 owner + observer

```cpp
class Engine {
    std::unique_ptr<Logger> logger_;  // Engine 拥有
    Config* config_;                   // 借用，由调用方管理
};
```

### FAIL: 值传递表达只读借用

```cpp
int sum(std::vector<int> values);  // 拷贝整个 vector
```

### PASS: span 表达借用

```cpp
int sum(std::span<const int> values);  // 零拷贝，只读
```
