# Unicorn 模拟执行

## 适用场景
- 需要在无完整运行环境下执行特定函数（解密、哈希、校验）。
- 需要绕过 JNI、syscall、libc 等环境依赖做算法还原。
- 需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 配合，先静态理解再模拟验证。
- 需要与 [frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 互补：Frida 需要真机，Unicorn 纯离线。

## 核心约束
- 先裸加载文件映射内存，不要解析 ELF/PE 头——只模拟目标函数，不是整个程序。
- 先识别外部调用依赖（JNI/libc/syscall），用 hook 模拟返回值。
- 优先用 `UC_HOOK_BLOCK` 做块级 trace，`UC_HOOK_CODE` 只用在小范围。
- 崩溃时读 callback 输出诊断，不要盲目重跑。

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

## 反模式

### FAIL: 解析完整 ELF 再映射所有段

```python
# 花大量时间解析 ELF，映射 .got / .plt / .dynamic
# → 大部分段对目标函数无用，反而引入更多未解析依赖
```

### PASS: 裸加载 + 按需映射

```python
with open("libcrypto.so", "rb") as f:
    code = f.read()
uc.mem_map(BASE, align(len(code)))
uc.mem_write(BASE, code)
uc.mem_map(STACK, 0x10000)  # 栈
uc.reg_write(UC_ARM64_REG_SP, STACK + 0x8000)
# 只在 UC_HOOK_MEM_UNMAPPED 回调中按需补映射
```
