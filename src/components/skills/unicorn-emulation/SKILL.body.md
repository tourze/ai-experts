## 环境模拟策略

| 依赖类型 | 示例 | 模拟方式 |
|---------|------|---------|
| libc | `malloc` / `memcpy` / `strlen` | hook 地址 → Python 实现（bump allocator） |
| JNI | `GetStringUTFChars` / `FindClass` | 构造假 JNIEnv 函数表，写 RET stub |
| syscall | `read` / `write` / `mmap` | `UC_HOOK_INTR` → 按 syscall number 分发 |
| C++ RT | `operator new` / `__cxa_throw` | hook → 返回成功/stub |

## 迭代调试流程

```
运行 → 崩溃 → 读 callback → 诊断 → 修复 → 重跑
         ↓
  未映射内存 fetch → 补映射
  未映射内存 read  → 补数据段或 hook
  命中 import stub → 添加模拟 hook
  死循环           → 加计数器，超阈值停止
```

## 架构速查

| 架构 | UC 常量 | SP | LR | 参数 | 返回 | Syscall |
|------|--------|----|----|-----|------|---------|
| ARM64 | `UC_ARCH_ARM64` | SP | X30 | X0-X7 | X0 | X8 + SVC #0 |
| ARM32 | `UC_ARCH_ARM` | SP | LR | R0-R3 | R0 | R7 + SVC #0 |
| x86-64 | `UC_ARCH_X86` + `UC_MODE_64` | RSP | (栈) | RDI,RSI,RDX,RCX | RAX | RAX + syscall |
| MIPS32 | `UC_ARCH_MIPS` | $sp | $ra | $a0-$a3 | $v0 | $v0 + syscall |
