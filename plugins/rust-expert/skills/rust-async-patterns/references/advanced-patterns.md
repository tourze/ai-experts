# Rust Async 进阶模式

本文件是 rust-async-patterns SKILL.md 的拆分内容，包含 async trait、超时边界与 MutexGuard 反模式的完整代码。

## async trait 抽象边界

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
    async fn load(&self, id: u64) -> Result<String, RepoError> { Ok(format!("job-{id}")) }
}

async fn load_job<R: JobRepo + Sync>(repo: &R, id: u64) -> Result<String, RepoError> {
    repo.load(id).await
}
```

## 超时放在外层边界

依赖：`tokio = { version = "1", features = ["time"] }`

```rust
use tokio::time::{sleep, timeout, Duration};

#[derive(Debug)] enum JobError { Timeout }

async fn slow_job() -> u64 { sleep(Duration::from_millis(50)).await; 42 }

async fn run_with_timeout() -> Result<u64, JobError> {
    timeout(Duration::from_millis(20), slow_job()).await.map_err(|_| JobError::Timeout)
}
```

## 反模式: MutexGuard 跨 await

### FAIL

```rust
let mut guard = shared.lock().unwrap();
guard.value += 1;
fetch_from_network().await;  // 锁持有期间 await，可能死锁
guard.apply();
```

### PASS: 缩小临界区

```rust
{
    let mut guard = shared.lock().unwrap();
    guard.value += 1;
} // 锁在 await 前释放
let data = fetch_from_network().await;
shared.lock().unwrap().apply(data);
```
