# CSO 改写示例

## workflow_leak + output_leak

**Before**:
```
在需要按 7 个维度评审架构、文档或代码库时使用；输出带证据的评分、风险等级和整改优先级。
```

**After**:
```
当需要评审架构、文档或代码库的设计质量时使用。
```

**分析**："7 个维度"是具体数字泄露，"输出带证据的评分"是 output_leak。改写后只保留触发场景。

---

## missing_trigger + workflow_leak

**Before**:
```
系统化调试方法论。按复现、隔离、假设、验证、修复、回归测试六步推进，防止随机乱试式调试。
```

**After**:
```
当遇到 bug 需要系统化定位根因而不是随机尝试修复时使用。
```

**分析**：原描述是方法论摘要，Claude 会按"六步"走捷径。改写后聚焦用户意图。

---

## missing_trigger + workflow_leak (覆盖范围)

**Before**:
```
Kotlin Coroutines 在 Android 上的生产级模式，覆盖结构化并发、生命周期集成、响应式流和异常处理。
```

**After**:
```
当在 Android 项目中使用 Kotlin Coroutines 处理异步、并发或响应式数据流时使用。
```

**分析**："覆盖 X、Y、Z"泄露了 SKILL.md 的覆盖范围。改写后保留关键触发词但不列举。

---

## output_leak

**Before**:
```
在需要识别、分类和排序技术债时使用；重点是形成债项清单、评分规则和分期治理建议。
```

**After**:
```
当需要识别、分类和排序技术债时使用。
```

**分析**：分号后面的"重点是..."全部是输出描述，直接删除。

---

## too_long

**Before** (319 字符):
```
Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill...
```

**After**:
```
Use when creating, editing, evaluating, or optimizing a skill's description for better triggering accuracy.
```

**分析**：长描述包含了工作流（measure performance, run evals）。压缩到触发条件。
