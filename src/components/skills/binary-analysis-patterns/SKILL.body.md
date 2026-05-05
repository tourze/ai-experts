## 代码模式
```bash
file sample.bin
strings -a sample.bin | head -n 40
objdump -d sample.bin | sed -n '1,120p'
```

## 检查清单
- 确认入口点、异常处理、导入表和关键字符串。
- 标出可疑分发函数、解密函数和状态机边界。
- 对关键分支同时看伪代码和汇编。
- 记录哪些函数已经确认，哪些仍需动态验证。

## 反模式

### FAIL: 只信伪代码

```c
// IDA 伪代码
int __cdecl auth(int a, int b) {
    return a == b;  // "看起来是简单比较"
}
```

```asm
; 实际汇编（伪代码看不到）
auth:
    mov eax, [rdi]
    cmp eax, [rsi]
    jne short fail
    ; ... 还有 30 行 timing-safe 比较 + HMAC 校验
```

### PASS: 关键分支回看汇编

```
1. 反编译先建假说
2. 鉴权 / 加密 / 路由分发函数 → 必须回看汇编
3. 编译器优化（内联、SROA、循环展开）会掩盖逻辑
```

### FAIL: 编译器模板当业务

```
看到 __security_check_cookie / __chkstk → 标为"反调试"
→ 实际是 MSVC 编译器自动插入的栈保护
→ 浪费时间分析无关代码
```

### PASS: 先识别工具链

```bash
# 检查编译器
strings binary | grep -i "compiled by\|gcc\|msvc\|clang"
# 用 IDA FLIRT 或 Ghidra signatures 自动识别库函数
# 把库函数从分析范围排除，聚焦业务符号
```
