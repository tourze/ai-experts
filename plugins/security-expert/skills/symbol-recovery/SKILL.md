---
name: symbol-recovery
description: "当需要为 stripped 二进制中的函数恢复符号名、识别已知库函数或算法实现时使用。"
---

# 符号恢复

## 适用场景
- 二进制被 strip，所有函数名是 `sub_XXXXX`，需要恢复语义命名。
- 需要识别标准库函数、加密算法或协议实现。
- 需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 配合做整体分析。
- 需要与 [struct-recovery](../struct-recovery/SKILL.md) 配合：结构体字段用途可反推函数语义。

## 核心约束
- 先用 IDA FLIRT / Ghidra signatures 自动识别库函数，手动分析仅针对未识别部分。
- 魔数匹配必须回看调用链确认——常量也可能来自编译器或壳。
- 命名要保守：不确定时用 `maybe_xxx` 前缀。
- 成对函数一起命名：`init/fini`、`lock/unlock`、`open/close`、`alloc/free`。

## 识别方法

### 方法 1：魔数与常量匹配

| 常量 | 算法 |
|------|------|
| `0x67452301`, `0xEFCDAB89` | MD5 |
| `0x6A09E667`, `0xBB67AE85` | SHA-256 |
| `0xEDB88320` | CRC32 |
| `0x63, 0x7C, 0x77, 0x7B...` (S-Box) | AES |
| `ABCDEF...+/` charset | Base64 |
| `0x78`, `0x9C` header | Zlib |

### 方法 2：参数模式推断

| 模式 | 推断 |
|------|------|
| `func(2, 1, 0)` → 返回 fd | `socket()` |
| `func(ptr, size, count, FILE*)` | `fread()` / `fwrite()` |
| `func(dst, src, n)` | `memcpy()` / `memmove()` |
| `func(ptr)` → 遍历直到 `\0` | `strlen()` |

### 方法 3：返回值与错误模式

| 模式 | 推断 |
|------|------|
| 成功返回 0，失败返回 -1 | POSIX 风格系统调用 |
| 返回 NULL 表示失败 | 分配类函数 |
| 返回 `this` 指针 | C++ 方法链 |
| 设置 errno | libc 函数 |

### 方法 4：调用图位置推断

```
入口函数调用它 → 可能是 init/setup
exit 前调用它 → 可能是 cleanup/fini
在循环中被调用且参数递增 → 可能是 process/handle
紧跟 malloc 之后 → 可能是 init_struct/constructor
```

## 检查清单
- 先跑 FLIRT/signatures 排除已知库函数。
- 魔数命中后回看调用链确认（排除壳/编译器误导）。
- 成对函数是否一致命名。
- 命名后检查交叉引用中的使用方式是否与命名一致。

## 反模式

### FAIL: 见到常量就定名

```
strings 输出包含 "AES"
→ 命名为 aes_encrypt
→ 实际：字符串来自 SSL 库的版本信息，函数本身是 TLS handshake
```

### PASS: 常量 + 调用链 + 结构验证

```
1. 找到 S-Box 常量 → 候选：AES 相关
2. 追踪调用链：被 4 轮循环调用，每轮 SubBytes+ShiftRows+MixColumns
3. 验证输入/输出大小：16 字节块
4. 确认命名：aes_encrypt_block
```
