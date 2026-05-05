## 代码模式

- [自定义 Runtime Builder](references/patterns.md#模式-1)
- [按需创建与空闲关闭](references/patterns.md#模式-2)
- [block_on 同步桥接](references/patterns.md#模式-3)
- [Runtime metrics 收集](references/patterns.md#模式-4)

## 反模式

### FAIL: async 内调 block_on

```rust
async fn handler() -> String {
    let rt = Runtime::new().unwrap();
    rt.block_on(other_async())  // panic: Cannot start runtime within runtime
}
```

### PASS: 直接 await

```rust
async fn handler() -> String { other_async().await }
// block_on 只用在 main 或同步桥接入口
```

### FAIL: worker 上做同步阻塞

```rust
#[tokio::main]
async fn main() {
    tokio::spawn(async {
        std::fs::read_to_string("big.log").unwrap();  // 阻塞整个 worker
    });
}
```

### PASS: spawn_blocking 隔离

```rust
tokio::spawn(async {
    tokio::task::spawn_blocking(|| std::fs::read_to_string("big.log"))
        .await.unwrap()
});
```
