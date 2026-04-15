---
name: rust-tokio-runtime-tuning
description: 用于 Tokio 运行时配置与调优；当任务涉及 Runtime::builder、worker 线程数、blocking 线程池、current_thread、Runtime::block_on 桥接或 tokio-console 监控时触发。
---

# Rust Tokio Runtime Tuning

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

- 不测量就设 worker 为 1 或 128。
- worker 上调同步 HTTP/文件锁：其他 task 饿死。
- 全局 lazy_static Runtime 永不释放：阻止干净退出。
- async 内调 `block_on`：直接 panic。
