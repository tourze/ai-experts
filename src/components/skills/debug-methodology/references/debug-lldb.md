# Debug LLDB

## 适用场景

- 应用无响应、切换上下文卡住、窗口冻结、命令行进程挂起，怀疑线程互锁或阻塞 I/O。
- CPU 飙高但日志证据不足，需要靠重复采样的线程栈识别忙循环或自旋热点。
- 需要快速抓取多次 all-thread backtrace，再用模式化方法判断是死锁、阻塞 IPC、主线程重入还是紧循环。
- 如果问题只发生在网页上下文，优先用 [chrome-devtools](../chrome-devtools/SKILL.md)；如果重点是浏览器自动化脚本本身，优先用 [browser-use](../browser-use/SKILL.md)。

## 核心约束

- 至少抓 3 次、间隔 0.2 到 1 秒的线程栈；单次采样很难区分死锁和偶发阻塞。
- 优先抓前台卡死应用或目标 worker 的真实 PID，不要只抓 dev server、launcher 或父进程。
- 先记录触发动作、时间窗口和相关日志，再附加线程栈；没有上下文的 backtrace 很难定位根因。
- 优先修“第一个异常副作用”而不是栈最底部的表面报错；线程栈是证据，不是补丁位置本身。
- 用脚本前先确认调试器可附加；如果 attach 失败，要把权限、签名、ptrace 限制一并记录清楚。

## 代码模式

```bash
ps -axo pid,comm | grep MyApp
mkdir -p /tmp/myapp-hang
for i in 1 2 3; do
  lldb -p 12345 -o 'thread backtrace all' -o 'detach' -o 'quit' > "/tmp/myapp-hang/stack_$i.txt" 2>&1
  sleep 0.5
done
```

```bash
mkdir -p /tmp/myapp-hang
PID=$(pgrep -n "MyApp")
for i in 1 2 3 4 5; do
  lldb -p "$PID" -o 'thread backtrace all' -o 'detach' -o 'quit' > "/tmp/myapp-hang/stack_$i.txt" 2>&1
  sleep 0.2
done
```

```bash
lldb -p 12345 -o 'thread backtrace all' -o 'detach' -o 'quit' > /tmp/hang-macos.txt 2>&1
gdb -q -p 12345 -ex "thread apply all bt" -ex "detach" -ex "quit" > /tmp/hang-linux.txt 2>&1
```

- 快速判型参考 [references/triage.md](references/triage.md)。
- 如需封装自动化采样，先登记为 procedure；运行时参考资料不要指向未生成的本地脚本。

## 检查清单

- 是否拿到了正确进程的 PID，而不是包装脚本、父进程或开发服务器。
- 是否至少采集了 3 次线程栈，并比较过主线程与 worker 线程的重复帧。
- 是否同时保留了触发动作、时间窗口和日志，方便和线程栈做因果对齐。
- 是否确认 attach 权限、调试器可用性以及平台差异（LLDB/GDB/WinDbg）。
- 是否把锁等待、阻塞 I/O、主线程重入、忙循环几种模式逐一排除或确认。

## 反模式

### FAIL: 单次采样下结论

```bash
lldb -p 12345 -o 'thread backtrace all'
# 看到一个 mutex wait → “死锁”
→ 实际可能是正常短时等待
```

### PASS: 多次采样对比

```bash
for i in 1 2 3 4 5; do
  lldb -p 12345 -o 'thread backtrace all' -o 'detach' > /tmp/stack_$i.txt
  sleep 0.5
done
diff /tmp/stack_1.txt /tmp/stack_5.txt
# 5 次都停同一 mutex → 真死锁
# 每次位置不同 → 只是高负载
```

### FAIL: 抓错 PID

```bash
ps -axo pid,comm | grep MyApp | head -1
# 拿到 launcher 进程 → 分析”launcher 在等子进程”（正常）
# 真卡死的主进程没抓到
```

### PASS: 定位真实主进程

```bash
ps -axo pid,ppid,comm | grep MyApp
# 看进程树，定位 UI 主进程
# macOS: Activity Monitor “Sample” 对比 PID
```
