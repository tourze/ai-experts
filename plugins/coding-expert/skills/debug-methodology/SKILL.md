---
name: debug-methodology
description: "当用户卡在 bug、stack trace、崩溃、间歇性失败或 flaky 行为，需要系统化调试时使用。英文触发词 debug / stuck / crash / flaky / can't reproduce。"
---

# 系统化调试方法论

## 适用场景
- 用户遇到 bug、异常行为、崩溃或性能问题。
- 用户已经试过一些修复但问题仍在，需要系统化排查。
- 交叉引用：修复后补测试配合 `test-driven-development`；修复涉及重构配合 `refactoring-checklist`。

## 核心约束

**违反字面规则 = 违反规则精神。不存在"灵活变通"。**

- 严格按六步流程推进，不跳步，尤其不能跳过"复现"直接猜原因。
- 每步都要有可观测证据，不靠直觉。
- 同一时间只变更一个变量。
- 修复必须针对根因，不是症状。
- 假设 10 分钟未证实就换假设。

## 六步流程
详细步骤见 [references/six-steps.md](./references/six-steps.md)，决策流程图见 [references/debug-flow.dot](./references/debug-flow.dot)。

1. **复现** — 稳定复现问题，明确期望 vs 实际行为。
2. **隔离** — 二分法缩小范围到具体模块/函数/行。
3. **假设** — 基于证据形成 1-3 个可证伪假设，按可能性排序。
4. **验证** — 每次只测一个假设，记录结果。
5. **修复** — 针对根因最小化修复，临时补丁必须标注。
6. **回归测试** — 补测试覆盖触发条件，跑现有测试确认无破坏。

## 检查清单
- [ ] 已稳定复现（或记录了无法复现的情况）
- [ ] 已缩小到具体模块/函数
- [ ] 假设基于证据，每次只变更一个变量
- [ ] 修复针对根因
- [ ] 已补回归测试

## 纪律守卫

**Iron Law：没有根因调查，不允许提出修复方案。**

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "我知道问题在哪，先改改试试" | 你看到的是症状，不是根因。走流程。 |
| "这个很简单，不用系统化" | 简单的 bug 也有根因。流程对简单 bug 更快。 |
| "紧急，没时间走流程" | 系统化调试比乱猜快。瞎试 3 次浪费的时间 > 走流程。 |
| "先加个 try-catch 顶一下" | 吞掉异常 = 藏住 bug，不是修好 bug。 |

完整的 Red Flags 表和 Rationalizations 对照表见 [references/discipline-guard.md](./references/discipline-guard.md)。

## 反模式

### FAIL: 修症状而非根因

```python
# "偶尔报 KeyError，加个 try-catch 顶一下"
try:
    value = data[key]
except KeyError:
    value = None  # 吞掉了，问题"消失"了
```

→ 根因是上游在某些条件下没填这个 key，吞异常只会让下游拿到 None 后产生更隐蔽的错误。

### PASS: 追根因 + 补回归测试

```python
# 根因：上游 transform() 在 items 为空时跳过了 key 赋值
# 修复：在 transform() 中保证 key 始终存在
def transform(raw):
    return {
        "key": raw.get("key", default_value),  # 修复点
        ...
    }

# 回归测试
def test_transform_empty_items():
    result = transform({"items": []})
    assert "key" in result
```

### FAIL: 同时改多处

```
"可能是 A 也可能是 B，两个都改了试试"
→ 测试通过了，但不知道是 A 还是 B 修好的
→ 下次类似 bug 还是不知道根因
```

### PASS: 每次只变更一个变量

```
假设 1：上游 transform() 缺少默认值 → 只改 transform()，跑测试
→ 测试通过 → 根因确认
→ 记录：transform() 在空输入时缺少 key 赋值
```
