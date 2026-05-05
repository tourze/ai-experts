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
