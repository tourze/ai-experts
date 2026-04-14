---
name: anti-reversing-techniques
description: "当用户需要分析、识别或绕过反调试、反虚拟机、混淆与保护壳时使用。"
---

# 反逆向与对抗技术

## 适用场景
- 需要识别样本中的反调试、反虚拟机、完整性校验或控制流混淆。
- 需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 联动做静态结构判读。
- 需要结合 [protocol-reverse-engineering](../protocol-reverse-engineering/SKILL.md) 验证对抗逻辑是否影响网络面。

## 核心约束
- 先确认保护层触发点，再决定是补丁、hook 还是动态绕过。
- 区分编译器/壳带来的噪声与业务逻辑本身，避免误判。
- 不要把“跑不起来”直接归因于恶意行为，先排查环境依赖和架构不匹配。
- 所有绕过动作都要附带触发条件和副作用说明。

## 代码模式
```bash
file sample.bin
strings -a sample.bin | rg 'IsDebuggerPresent|VMware|VirtualBox|ptrace'
objdump -d sample.bin | sed -n '1,120p'
```

## 检查清单
- 确认架构、操作系统、打包方式和入口点。
- 把反调试、反 VM、完整性校验、混淆拆开单独分析。
- 动态调试前准备快照、环境变量和最小复现输入。
- 记录哪些结论来自证据，哪些仍是推断。

## 反模式
- 一上来就粗暴 NOP 掉所有检查。
- 把壳层 API 名称误当成核心业务逻辑。
- 未确认条件就宣称样本“具有某种反沙箱能力”。
