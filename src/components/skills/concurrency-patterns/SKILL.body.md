## 通用模式

### 并发限流

```
任务队列 → 信号量/令牌桶（N 并发）→ Worker 池
超过并发上限的任务排队或快速失败（取决于场景）
```

### 取消传播

```
入口 ctx/timeout
  ├─ 子任务 A：select { case <-ctx.Done(): return }
  ├─ 子任务 B：select { case <-ctx.Done(): return }
  └─ 子任务 C：select { case <-ctx.Done(): return }
任一 ctx 取消，所有子任务在 next await/yield/select 点退出
```

### 优雅停机

```
1. 收到 SIGTERM/SIGINT
2. 停止接受新请求/新消息
3. 排空进行中请求（有超时上限）
4. 关闭连接池、刷新缓冲
5. 退出
```
