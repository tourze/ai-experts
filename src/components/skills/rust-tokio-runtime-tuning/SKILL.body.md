## 适用场景

- 为服务/CLI/移动端选择合适的 runtime 配置。
- 调整 worker 线程数、blocking 上限或栈大小。
- 在同步代码中嵌入 async（`block_on` 桥接）。
- 用 metrics / tokio-console 定位瓶颈。

## 核心约束

1. `worker_threads` 先测量再设；默认 num_cpus 常过多。
2. 同步 IO / CPU 密集必须 `spawn_blocking`。
3. 组件有独立生命周期时用独立 Runtime。
4. 资源受限环境优先 `current_thread`。
5. `max_blocking_threads` 按实际阻塞数设；默认 512 过大。
6. `block_on` 只在非 async 上下文调用。
7. 先观测再调参。

## 代码模式

- [自定义 Runtime Builder](references/patterns.md#模式-1)
- [按需创建与空闲关闭](references/patterns.md#模式-2)
- [block_on 同步桥接](references/patterns.md#模式-3)
- [Runtime metrics 收集](references/patterns.md#模式-4)

## 检查清单

- worker_threads 基于实测？有 worker 上的阻塞操作？
- `block_on` 只在非 async 上下文？线程名有意义？

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
