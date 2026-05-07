# Rust Async Runtime Examples

## JoinSet + Semaphore 有上限并发

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
    while let Some(result) = set.join_next().await {
        output.push(result.expect("panic"));
    }
    output.sort_unstable();
    output
}
```

## CancellationToken 显式传播停机

```rust
use tokio::{select, sync::mpsc, time::{sleep, Duration}};
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

为每个 spawned task 明确所有者、取消信号和 join / abort 策略。
