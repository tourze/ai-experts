---
name: rust-async-patterns
description: 当用户需要开发或排障 Tokio 异步代码时使用；涉及 tokio::spawn、JoinSet、channel、select! 或异步生命周期时触发。
---

# Rust Async Patterns

## 适用场景

- 构建基于 Tokio 的网络服务、worker、任务编排器或后台轮询器。
- 排查 `future is not Send`、`spawn` 要求 `'static`、任务泄漏、取消不生效、超时缺失、锁跨 `await` 等问题。
- 需要确定 channel、`JoinSet`、`Semaphore`、`CancellationToken`、`select!` 的使用边界时。
- trait 需要异步方法，或者需要把同步代码安全地接到 async 边界上时。
- 如果问题核心是借用/克隆、错误类型、文档或测试风格，而不是运行时行为，切到 [rust-ownership-idioms](../rust-ownership-idioms/SKILL.md)。

## 核心约束

- `tokio::spawn` 只接受 `Send + 'static` future。拿不出 `'static` 所有权时，不要硬塞，先重画数据边界。
- async 代码里禁止直接做阻塞工作；CPU 密集或同步 IO 用 `spawn_blocking`，不要把线程阻塞藏在 `async fn` 里。
- 锁的持有范围必须短于 `await`。需要跨异步边界共享状态时，优先消息传递，其次缩小临界区。
- 并发必须有上限：`JoinSet` 负责收尸，`Semaphore` 负责限流，channel 容量负责背压。
- 超时、取消和优雅停机要在边界层显式声明，而不是靠任务自然结束。
- 异步 trait 只有在抽象边界真的需要时才引入；能用泛型参数的地方，不要过早转 trait object。
- 诊断顺序固定：先确认任务是谁 spawn 的，再看取消信号有没有传到，再看是否有阻塞/锁跨 `await`。

## 代码模式

### 1. `JoinSet` + `Semaphore` 做有上限的并发

依赖：`tokio = { version = "1", features = ["macros", "rt-multi-thread", "sync", "time"] }`

```rust
use std::sync::Arc;
use tokio::{
    sync::Semaphore,
    task::JoinSet,
    time::{sleep, Duration},
};

async fn run_jobs(inputs: Vec<u64>, limit: usize) -> Vec<u64> {
    let limit = Arc::new(Semaphore::new(limit));
    let mut set = JoinSet::new();

    for value in inputs {
        let permit = limit
            .clone()
            .acquire_owned()
            .await
            .expect("semaphore closed");

        set.spawn(async move {
            let _permit = permit;
            sleep(Duration::from_millis(10)).await;
            value * 2
        });
    }

    let mut output = Vec::new();
    while let Some(result) = set.join_next().await {
        output.push(result.expect("task panicked"));
    }

    output.sort_unstable();
    output
}
```

### 2. 用 `CancellationToken` 显式传播停机信号

依赖：`tokio = { version = "1", features = ["sync", "time"] }`，`tokio-util = "0.7"`

```rust
use tokio::{
    select,
    sync::mpsc,
    time::{sleep, Duration},
};
use tokio_util::sync::CancellationToken;

async fn worker(mut rx: mpsc::Receiver<u32>, stop: CancellationToken) -> Vec<u32> {
    let mut handled = Vec::new();

    loop {
        select! {
            _ = stop.cancelled() => break,
            item = rx.recv() => match item {
                Some(value) => {
                    sleep(Duration::from_millis(5)).await;
                    handled.push(value);
                }
                None => break,
            },
        }
    }

    handled
}
```

### 3. 在必须抽象的边界上使用 async trait

依赖：`async-trait = "0.1"`

```rust
use async_trait::async_trait;

#[derive(Debug)]
struct RepoError;

#[async_trait]
trait JobRepo {
    async fn load(&self, id: u64) -> Result<String, RepoError>;
}

struct MemoryRepo;

#[async_trait]
impl JobRepo for MemoryRepo {
    async fn load(&self, id: u64) -> Result<String, RepoError> {
        Ok(format!("job-{id}"))
    }
}

async fn load_job<R: JobRepo + Sync>(repo: &R, id: u64) -> Result<String, RepoError> {
    repo.load(id).await
}
```

### 4. 把超时放在外层边界，而不是散落在内部实现里

依赖：`tokio = { version = "1", features = ["time"] }`

```rust
use tokio::time::{sleep, timeout, Duration};

#[derive(Debug, PartialEq, Eq)]
enum JobError {
    Timeout,
}

async fn slow_job() -> u64 {
    sleep(Duration::from_millis(50)).await;
    42
}

async fn run_with_timeout() -> Result<u64, JobError> {
    timeout(Duration::from_millis(20), slow_job())
        .await
        .map_err(|_| JobError::Timeout)
}
```

## 检查清单

- 这个 `async fn` 里是否混入了阻塞调用？如果有，是否应该改成 `spawn_blocking`？
- `tokio::spawn` 捕获的值是否都满足 `Send + 'static`？如果不满足，是不是边界设计问题？
- 是否存在 `MutexGuard`、数据库事务句柄、文件句柄跨 `await` 存活？
- 并发是否有上限，还是“来多少任务就无限 spawn 多少任务”？
- channel 容量、关闭语义和消费者退出条件是否明确？
- 是否存在取消信号发出后任务仍然卡住的路径？
- 错误和超时是在入口边界统一处理，还是在每个内部 helper 里各自吞掉？

## 反模式

- 在 async 代码里调用 `std::thread::sleep`、同步文件 IO 或长时间 CPU 计算：这会直接堵住 runtime worker。
- 手里有引用和锁就去 `tokio::spawn`：通常会马上撞上 `'static` / `Send`，或者更糟的是绕过去后引入悬垂设计。
- 无上限 `spawn`：问题不会立刻报错，但会在高压下以内存、排队延迟和取消失效的形式回来。
- 任务只 spawn 不 join：出错时没有回收点，也不知道谁已经 panic 或提前退出。
- 用共享可变状态代替消息边界：短期写起来快，长期最难调。
- 内层 helper 自己决定超时和重试：最终会形成多个互相打架的时钟。
