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

共享所有权（`weak_ptr` 打断环）、C 单出口 cleanup、Rust 对照校验的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。
