---
name: binary-analysis-patterns
description: "当需要对可执行文件、库或固件组件做静态反汇编、反编译和模式识别时使用。"
---

# 二进制分析模式

## 适用场景
- 需要理解入口点、导入表、字符串、控制流和数据结构。
- 需要和 [anti-reversing-techniques](../anti-reversing-techniques/SKILL.md) 联动分析保护逻辑。
- 协议编解码或加密路径不清晰时，可切到 [protocol-reverse-engineering](../protocol-reverse-engineering/SKILL.md)。

## 核心约束
- 先识别架构、位数、ABI 和编译器痕迹，再选工具链。
- 反编译结果只是假说，必须回到汇编和交叉引用确认。
- 把初始化/框架噪声与业务逻辑拆开。
- 所有关键结论都要标明函数、偏移或字符串证据。

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
- 只看伪代码，不回看汇编。
- 把编译器模板代码误当业务逻辑。
- 没有证据就断言某个函数“负责鉴权/加密”。
