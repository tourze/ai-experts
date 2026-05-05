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
