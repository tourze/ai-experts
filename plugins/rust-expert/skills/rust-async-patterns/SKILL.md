---
name: rust-async-patterns
description: 当用户需要开发或排障 Tokio 异步代码时使用；涉及 tokio::spawn、JoinSet、channel、select! 或异步生命周期时触发。
---

# Rust Async Patterns

## 适用场景

- 构建基于 Tokio 的网络服务、worker、任务编排器或后台轮询器。
- 排查 `future is not Send`、`spawn` 要求 `'static`、任务泄漏、取消不生效、超时缺失、锁跨 `await` 等问题。
- 需要确定 channel、`JoinSet`、`Semaphore`、`CancellationToken`、`select!` 的使用边界时。

通用并发原则（不阻塞异步上下文、限制并发、传播取消、不共享可变状态、超时所有外部调用、优雅停机）见 architecture-expert 的 concurrency-patterns skill。

## Rust 特有约束

- `tokio::spawn` 只接受 `Send + 'static` future。拿不出 `'static` 所有权时，先重画数据边界。
- async 代码里禁止直接做阻塞工作；CPU 密集或同步 IO 用 `spawn_blocking`。
- 锁的持有范围必须短于 `await`。需要跨异步边界共享状态时，优先消息传递。
- 并发必须有上限：`JoinSet` 负责收尸，`Semaphore` 负责限流，channel 容量负责背压。
- 诊断顺序固定：先确认任务是谁 spawn 的 → 看取消信号有没有传到 → 看是否有阻塞/锁跨 `await`。

## Rust 代码模式

### JoinSet + Semaphore 有上限并发

```rust
use std::sync::Arc;
use tokio::{sync::Semaphore, task::JoinSet, time::{sleep, Duration}};

async fn run_jobs(inputs: Vec<u64>, limit: usize) -> Vec<u64> {
    let sem = Arc::new(Semaphore::new(limit));
    let mut set = JoinSet::new();
    for value in inputs {
        let permit = sem.clone().acquire_owned().await.expect("closed");
        set.spawn(async move {
            let _permit = permit;
            sleep(Duration::from_millis(10)).await;
            value * 2
        });
    }
    let mut output = Vec::new();
    while let Some(r) = set.join_next().await { output.push(r.expect("panic")); }
    output.sort_unstable();
    output
}
```

### CancellationToken 显式传播停机

```rust
use tokio::{select, sync::mpsc, time::{sleep, Duration}};
use tokio_util::sync::CancellationToken;

async fn worker(mut rx: mpsc::Receiver<u32>, stop: CancellationToken) -> Vec<u32> {
    let mut handled = Vec::new();
    loop {
        select! {
            _ = stop.cancelled() => break,
            item = rx.recv() => match item {
                Some(value) => { sleep(Duration::from_millis(5)).await; handled.push(value); }
                None => break,
            },
        }
    }
    handled
}
```

async trait 与超时边界的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 反模式

### FAIL: async 里做阻塞

```rust
async fn process(path: &Path) -> io::Result<String> {
    std::thread::sleep(Duration::from_secs(1));  // 堵 runtime worker
    std::fs::read_to_string(path)
}
```

### PASS: tokio 异步 API / spawn_blocking

```rust
async fn process(path: &Path) -> io::Result<String> {
    tokio::time::sleep(Duration::from_secs(1)).await;
    tokio::fs::read_to_string(path).await
}
// CPU 密集任务：
let result = tokio::task::spawn_blocking(|| heavy_compute()).await?;
```

MutexGuard 跨 await 的反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。
