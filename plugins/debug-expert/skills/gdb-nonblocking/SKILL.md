---
name: gdb-nonblocking
description: "当需要用 GDB 调试运行中的进程而不阻塞 agent 时使用；通过 named pipe + dprintf 实现非阻塞 trace。"
---

# GDB 非阻塞调试

## 适用场景
- 需要在调试进程的同时保持 agent 可响应（不被 breakpoint 阻塞）。
- 需要对长时间运行的进程做条件化 trace 而不暂停。
- 需要与 [debug-lldb](../debug-lldb/SKILL.md) 区分：本 skill 用 GDB（Linux），LLDB 用于 macOS/iOS。

## 核心约束
- **仅 Linux**：依赖 POSIX signal 和 named pipe。
- 使用 `dprintf` 而非 `break`——dprintf 输出后自动 continue，不会阻塞。
- SIGINT 后至少等 1 秒再发下一条命令（否则命令被丢弃）。
- 停止时先 kill 进程再删 pipe（顺序反了会产生孤儿进程）。

## 工作原理

```
Agent ──写命令──→ gdb_cmd_pipe (FIFO) ──→ GDB stdin
                                            ↓
Agent ←─读日志──← trace.log ←───────────── GDB logging
```

- GDB 在后台运行，从 named pipe 读命令。
- `dprintf` 命中时打印并自动 continue，输出写入 trace.log。
- Agent 通过读 trace.log 获取 trace 结果，全程不阻塞。

## 实施步骤

### 步骤 1：启动会话

```bash
mkfifo gdb_cmd_pipe
tail -f gdb_cmd_pipe | gdb-multiarch -q --args ./target &
echo $! > .gdb_pid
# 配置日志
echo "set pagination off" > gdb_cmd_pipe
echo "set logging file trace.log" > gdb_cmd_pipe
echo "set logging enabled on" > gdb_cmd_pipe
```

### 步骤 2：设置 dprintf trace

```bash
# 格式：dprintf <位置>, "<格式串>", <参数...>
echo 'dprintf main.c:120, "iter=%d val=%s\n", i, buf' > gdb_cmd_pipe
echo 'continue' > gdb_cmd_pipe
```

### 步骤 3：条件化 trace

```bash
echo 'dprintf loop_func, "hit: %d\n", counter' > gdb_cmd_pipe
echo 'condition $bpnum counter == 100' > gdb_cmd_pipe
```

### 步骤 4：读取结果

```bash
tail -n 20 trace.log
```

### 步骤 5：修改 trace（中断 → 改 → 继续）

```bash
kill -INT $(cat .gdb_pid)
sleep 1  # 必须等待
echo "delete" > gdb_cmd_pipe           # 清除所有 tracepoint
echo 'dprintf new_func, "new: %d\n", x' > gdb_cmd_pipe
echo "continue" > gdb_cmd_pipe
```

### 步骤 6：停止会话

```bash
kill $(cat .gdb_pid) 2>/dev/null
wait $(cat .gdb_pid) 2>/dev/null
rm -f gdb_cmd_pipe .gdb_pid trace.log
```

## Agent 效率提示
- **合并 tool call**：interrupt + query + resume 放在一个 Bash 调用中。
- **sleep + tail 合并**：`sleep 2 && tail -n 50 trace.log` 一次调用。
- 设置条件 trace 时先 inspect 当前值，避免条件值已过（单调递增的 counter）。

## 反模式

### FAIL: 用 break 而非 dprintf

```gdb
break main.c:120
continue
# → 命中后 GDB 暂停，agent 阻塞
# → 无法响应用户，无法多任务
```

### PASS: 用 dprintf 自动 continue

```gdb
dprintf main.c:120, "hit line 120: x=%d\n", x
continue
# → 命中后打印到 trace.log 并继续运行
# → agent 随时可以读 log，不阻塞
```

### FAIL: 先删 pipe 再 kill

```bash
rm gdb_cmd_pipe  # pipe 没了
kill $(cat .gdb_pid)  # GDB 和 tail 变成孤儿进程
```

### PASS: 先 kill 等 exit 再清理

```bash
kill $(cat .gdb_pid)
wait $(cat .gdb_pid) 2>/dev/null
rm -f gdb_cmd_pipe .gdb_pid trace.log
```
