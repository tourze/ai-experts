---
name: struct-recovery
description: "当需要从反编译代码中恢复数据结构定义、推断字段类型和布局时使用。"
---

# 结构体恢复

## 适用场景
- 需要从 IDA/Ghidra 反编译输出中推断 stripped 结构体的字段布局。
- 需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 配合做深入逆向。
- 需要与 [idapython-scripting](../idapython-scripting/SKILL.md) 配合批量提取内存访问模式。

## 核心约束
- 先收集多个函数中的偏移访问，再推断结构体——不要只看一个函数。
- 所有偏移必须标注访问方式（读/写）和类型（BYTE/DWORD/QWORD/指针）。
- 置信度标注：高（多函数一致）/ 中（单函数）/ 低（推测）。
- 常见误判：编译器插入的 padding 不是字段；vtable 指针在 offset 0 不代表所有对象都有。

## 恢复步骤

### 步骤 1：收集目标函数中的偏移访问

```c
// 从反编译代码中提取模式
*(a1 + 0x10)           // offset 0x10, 指针大小
*(_DWORD *)(a1 + 8)    // offset 0x08, DWORD
*(_BYTE *)(a1 + 4)     // offset 0x04, BYTE
```

### 步骤 2：遍历 caller 分析参数传递

```c
v1 = malloc(0x40);     // → 结构体大小约 0x40
*v1 = 0;               // offset 0x00 初始化
*(v1 + 8) = callback;  // offset 0x08 是函数指针
sub_401000(v1);
```

### 步骤 3：遍历 callee 分析参数使用

```c
int callee(void *a1) {
    return *(a1 + 0x18);  // 新增 offset 0x18
}
```

### 步骤 4：汇总推断

按偏移排序，推断类型：
- 被当函数指针调用 → `callback_fn`
- 传给 `strlen`/`printf` → `char *`
- 有 `++`/`--` 操作 → counter/refcount
- 有 `& 0x1`/`& 0x2` → flags
- 有 next/prev 指针对 → 链表节点

## 输出格式

```c
// 估计大小: 0x48 bytes | 置信度: 高
struct suggested_name {
    /* 0x00 */ void *vtable;        // 虚表指针
    /* 0x08 */ int refcount;        // ++/-- 操作
    /* 0x0C */ int flags;           // AND 0x1, 0x2
    /* 0x10 */ char *name;          // 传给 strlen/printf
    /* 0x18 */ void *data;          // 数据指针
    /* 0x20 */ size_t size;         // 大小字段
    /* 0x28 */ struct node *next;   // 链表 next
    /* 0x30 */ struct node *prev;   // 链表 prev
};
```

## 反模式

### FAIL: 只看一个函数就定结构

```
看到 *(a1 + 0x10) 被写入 → "offset 0x10 是数据字段"
→ 另一个函数中 *(a1 + 0x10) 被当函数指针调用
→ 结论完全错误
```

### PASS: 多函数交叉验证

```
函数 A: *(a1+0x10) = malloc(...)  → 写入指针
函数 B: (*(a1+0x10))(a1)         → 当回调调用
函数 C: free(*(a1+0x10))         → 释放
→ offset 0x10 是动态分配的回调函数指针
```
