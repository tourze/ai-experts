# 进阶所有权模式

本文件是 memory-safety-patterns SKILL.md 的拆分内容，包含共享所有权、C 单出口 cleanup 和 Rust 对照校验的完整代码。

## 模式 3：必须共享所有权时，用 `weak_ptr` 明确打断环

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

## 模式 4：C 代码统一走单出口 cleanup，别把释放逻辑复制到每个分支

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

## 模式 5：用 Rust 所有权模型校对 C++ 设计是否说得清

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

用法：如果一段 C++ 接口很难说清"谁拥有、谁借用、谁可写"，先拿 Rust 语义翻译一次，接口问题通常会自己暴露。
