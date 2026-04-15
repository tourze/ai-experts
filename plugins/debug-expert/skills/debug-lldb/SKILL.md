---
name: debug-lldb
description: 当应用卡死、出现死锁、UI 冻结、IPC 阻塞或高 CPU 忙循环时使用。通过 LLDB/GDB 捕获线程回溯并定位根因。
---

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
bash skills/debug-lldb/scripts/collect_stacks.sh --pid 12345 --out /tmp/myapp-hang --repeat 3 --sleep 0.5
```

```bash
bash skills/debug-lldb/scripts/collect_stacks.sh --name "MyApp" --out /tmp/myapp-hang --repeat 5 --sleep 0.2
```

```bash
lldb -p 12345 -o 'thread backtrace all' -o 'detach' -o 'quit' > /tmp/hang-macos.txt 2>&1
gdb -q -p 12345 -ex "thread apply all bt" -ex "detach" -ex "quit" > /tmp/hang-linux.txt 2>&1
```

- 快速判型参考 [references/triage.md](references/triage.md)。
- 脚本入口是 [scripts/collect_stacks.sh](scripts/collect_stacks.sh)，支持 `--pid`、`--name`、`--repeat`、`--sleep` 和 `--out`。

## 检查清单

- 是否拿到了正确进程的 PID，而不是包装脚本、父进程或开发服务器。
- 是否至少采集了 3 次线程栈，并比较过主线程与 worker 线程的重复帧。
- 是否同时保留了触发动作、时间窗口和日志，方便和线程栈做因果对齐。
- 是否确认 attach 权限、调试器可用性以及平台差异（LLDB/GDB/WinDbg）。
- 是否把锁等待、阻塞 I/O、主线程重入、忙循环几种模式逐一排除或确认。

## 反模式

- 只抓一次线程栈，就急着下结论说“是死锁”或“是 CPU 高”。
- 看到报错栈最底部就打补丁，而不追到第一处异常等待、写入或同步点。
- 抓错 PID，最后分析的是 launcher、watcher 或 shell，本体进程却没采到。
- 明明是主线程阻塞，却只盯着 worker 线程，不做跨线程对照。
- attach 失败后直接放弃，不记录权限限制、签名问题或调试器缺失。
