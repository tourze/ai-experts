# Rust Tokio Runtime Tuning - 代码模式

## 模式 1

### 自定义 Runtime Builder

依赖：`tokio = { version = "1", features = ["macros", "rt-multi-thread", "time", "sync"] }`

```rust
use tokio::runtime::Runtime;
use std::time::Duration;

/// Build a runtime tuned for an IO-heavy service with known
/// concurrency characteristics.
fn build_service_runtime() -> Runtime {
    Runtime::builder()
        .worker_threads(4) // Match expected IO concurrency, not CPU count.
        .max_blocking_threads(16) // Limit synchronous IO parallelism.
        .thread_name("svc-worker")
        .thread_stack_size(2 * 1024 * 1024) // 2 MiB per thread.
        .enable_all()
        .build()
        .expect("failed to build tokio runtime")
}

/// Build a lightweight runtime for a CLI tool or mobile SDK.
fn build_lightweight_runtime() -> Runtime {
    Runtime::builder()
        .worker_threads(1)
        .max_blocking_threads(2)
        .thread_name("lite-worker")
        .thread_stack_size(1024 * 1024) // 1 MiB
        .enable_all()
        .build()
        .expect("failed to build tokio runtime")
}

async fn do_work() -> u64 {
    tokio::time::sleep(Duration::from_millis(10)).await;
    42
}

fn main() {
    let rt = build_service_runtime();
    let result = rt.block_on(do_work());
    println!("result = {result}");
}
```

## 模式 2

### 按需创建与空闲关闭的 Runtime

依赖：`tokio = { version = "1", features = ["rt-multi-thread"] }`

```rust
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tokio::runtime::Runtime;

/// A runtime holder that creates the runtime on first use
/// and drops it after a period of inactivity.
pub struct LazyRuntime {
    inner: Mutex<Option<(Runtime, Instant)>>,
    idle_timeout: Duration,
}

impl LazyRuntime {
    pub fn new(idle_timeout: Duration) -> Self {
        Self {
            inner: Mutex::new(None),
            idle_timeout,
        }
    }

    /// Run an async task on the managed runtime.
    /// Creates the runtime if it does not exist.
    pub fn block_on<F, T>(&self, future: F) -> T
    where
        F: std::future::Future<Output = T>,
    {
        let mut guard = self.inner.lock().unwrap();
        let (rt, last_used) = guard.get_or_insert_with(|| {
            let rt = Runtime::builder()
                .worker_threads(2)
                .max_blocking_threads(4)
                .thread_name("lazy-worker")
                .enable_all()
                .build()
                .expect("failed to build runtime");
            (rt, Instant::now())
        });
        *last_used = Instant::now();
        rt.block_on(future)
    }

    /// Shut down the runtime if it has been idle longer than the timeout.
    /// Call this from a periodic maintenance routine.
    pub fn maybe_shutdown(&self) {
        let mut guard = self.inner.lock().unwrap();
        let should_drop = guard
            .as_ref()
            .map(|(_, last)| last.elapsed() > self.idle_timeout)
            .unwrap_or(false);
        if should_drop {
            guard.take(); // Dropping the Runtime shuts down worker threads.
        }
    }
}
```

## 模式 3

### Runtime::block_on 同步桥接

依赖：`tokio = { version = "1", features = ["rt-multi-thread", "time"] }`，`reqwest = { version = "0.12", features = ["json"] }`

```rust
use tokio::runtime::Runtime;

/// Async function that cannot be changed (e.g., from a library).
async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let resp = reqwest::get(url).await?;
    resp.text().await
}

/// Synchronous public API for callers who cannot use async.
pub struct SyncClient {
    rt: Runtime,
    base_url: String,
}

impl SyncClient {
    pub fn new(base_url: impl Into<String>) -> Self {
        let rt = Runtime::builder()
            .worker_threads(2)
            .enable_all()
            .build()
            .expect("failed to build runtime");
        Self {
            rt,
            base_url: base_url.into(),
        }
    }

    /// Blocking call that internally runs async code.
    /// Must NOT be called from within an async context.
    pub fn get(&self, path: &str) -> Result<String, reqwest::Error> {
        let url = format!("{}{}", self.base_url, path);
        self.rt.block_on(fetch_data(&url))
    }
}

fn main() {
    let client = SyncClient::new("https://httpbin.org");
    match client.get("/get") {
        Ok(body) => println!("response length = {}", body.len()),
        Err(e) => eprintln!("request failed: {e}"),
    }
}
```

## 模式 4

### Runtime Metrics 收集

依赖：`tokio = { version = "1", features = ["rt-multi-thread", "time"] }`

需要编译时 `RUSTFLAGS="--cfg tokio_unstable"`。

```rust
use std::time::Duration;
use tokio::runtime::Runtime;

fn build_monitored_runtime() -> Runtime {
    Runtime::builder()
        .worker_threads(4)
        .enable_all()
        .build()
        .expect("failed to build runtime")
}

/// Periodically log runtime metrics for monitoring dashboards.
async fn metrics_reporter(rt_handle: tokio::runtime::Handle) {
    let mut interval = tokio::time::interval(Duration::from_secs(10));
    loop {
        interval.tick().await;
        let metrics = rt_handle.metrics();

        let workers = metrics.num_workers();
        let blocking = metrics.num_blocking_threads();
        let active = metrics.active_tasks_count();

        // In production, emit as structured log / prometheus metrics.
        eprintln!(
            "[runtime] workers={workers} blocking_threads={blocking} \
             active_tasks={active}"
        );
    }
}

fn main() {
    let rt = build_monitored_runtime();
    let handle = rt.handle().clone();

    rt.block_on(async move {
        tokio::spawn(metrics_reporter(handle));
        // ... main application logic ...
        tokio::time::sleep(Duration::from_secs(60)).await;
    });
}
```

配合 tokio-console（开发阶段）：

```toml
[dependencies]
console-subscriber = "0.4"
tokio = { version = "1", features = ["full", "tracing"] }
```

```rust
fn main() {
    // Initialize tokio-console subscriber for local debugging.
    console_subscriber::init();

    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .enable_all()
        .build()
        .unwrap();

    rt.block_on(async {
        // Tasks will be visible in `tokio-console` TUI.
        tokio::spawn(async {
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
        })
        .await
        .unwrap();
    });
}
```
