---
name: arthas-cpu-high
description: 排查 JVM 或应用 CPU 飙高，聚焦线程定位、热点方法确认与证据化结论
---

# Arthas CPU 飙高排查

## 适用场景

- Java 进程 CPU 飙高、请求明显变慢、机器负载异常升高。
- 需要快速确认是计算热点、锁竞争、GC 压力还是日志/序列化开销。
- 已能连到目标 JVM，并且允许使用 Arthas 做只读诊断。
- 如果怀疑是 Spring Bean 装配或配置注入问题，转到 [arthas-springcontext-issues-resolve](../arthas-springcontext-issues-resolve/SKILL.md)。

## 核心约束

- 先只读、后追踪：必须先拿到 `dashboard` 与 `thread` 证据，再决定是否使用 `trace` / `watch`。
- 严格限量：`-n`、`-c`、条件表达式和目标类名必须收敛，避免把线上 JVM 打成第二次故障。
- 先定位线程，再确认方法：不要一上来对整个包做 `trace` 或 `watch`。
- 输出必须带证据：至少包含线程 ID、线程状态、关键堆栈和推断原因，不能只给口头结论。

## 代码模式

```bash
# 先看整体趋势，限制次数避免持续刷屏
dashboard -n 3

# 找最忙的前 5 个线程
thread -n 5

# 对某个热点线程打印完整堆栈
thread 42
```

```bash
# 当堆栈已经收敛到具体方法后，再做有限 trace
trace com.example.order.OrderService placeOrder '#cost > 20' -n 5

# 只在确认需要入参与返回值时再用 watch
watch com.example.order.OrderService placeOrder '{params, returnObj}' -n 3
```

```text
结论模板：
1. 现象：CPU 高、线程数变化、GC 情况。
2. 证据：topN 线程 ID + 关键堆栈。
3. 判断：计算热点 / 锁竞争 / GC / 序列化 / 日志。
4. 下一步：应继续 trace 哪个方法，或需要用户补充哪个业务入口。
```

## 检查清单

- 是否先执行了 `dashboard` 和 `thread -n N`，而不是直接上重型命令。
- 是否记录了热点线程的 `threadId`、线程名、状态和关键方法。
- 如果出现大量 `BLOCKED`，是否继续定位阻塞源头，而不是把阻塞线程误判为 CPU 热点。
- `trace` / `watch` 是否限制了类名、方法名、次数和条件表达式。
- 报告里是否明确区分“观察到的事实”和“基于事实的推断”。

## 反模式

- 对主包或 `*` 通配直接 `trace`，把线上诊断变成性能放大器。
- 只说“CPU 在某个服务里高”，却不给线程堆栈和线程 ID。
- 把 `RUNNABLE` 全部当作 CPU 热点，没有先看采样次数和堆栈一致性。
- 在问题未收敛前就执行 `tt`、全量 `watch` 或大对象输出。
