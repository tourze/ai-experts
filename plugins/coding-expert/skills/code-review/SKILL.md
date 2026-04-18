---
name: code-review
description: "当用户要求审查代码质量、发现命名或职责问题、检查错误处理和边界情况时使用。"
---

# 代码审查

## 适用场景
- 用户提交代码或文件，要求找出逻辑和设计层面的问题。
- 关注"代码写得好不好"，不是"能不能上线"（那用 `pre-landing-review`）。
- 交叉引用：高压审查配合 `brutal-honesty-review`；降低复杂度配合 `complexity-reducer`。

## 核心约束

**违反字面规则 = 违反规则精神。不存在"灵活变通"。**

- 先读真实代码或 diff，不凭猜测。
- 不审查纯风格问题（缩进、括号、行长度）——那是 linter 的事。
- 每条发现必须遵循 **Iron Law 四要素**：Symptom → Source → Consequence → Remedy，缺一不可。
- 按严重度分级：🔴 关键 > 🟡 重要 > 🟢 建议。每个维度都有严重度指引和"不应标记"规则。
- 审查结束输出 **Health Score**（100 分制），让质量可量化、可追踪。
- 无问题则明确说明，不硬凑——100 分是合法的。

## 审查维度
审查时必须读取 [references/dimensions.md](./references/dimensions.md)，按六个维度逐项检查：命名与语义、函数设计、错误处理、逻辑与边界、DRY 与抽象、可读性。每个维度含严重度指引和"不应标记"规则。

## 输出格式
读取 [references/health-score.md](./references/health-score.md)，按四要素格式输出，含 Health Score。

## 检查清单
- [ ] 已读取实际代码或 diff
- [ ] 每条发现含四要素（Symptom / Source / Consequence / Remedy）
- [ ] 按严重度分级输出，参考了各维度的严重度指引
- [ ] 检查了"不应标记"规则，未误报
- [ ] 计算并输出 Health Score
- [ ] 未混入 linter 能抓的风格问题

## 纪律守卫

**Iron Law：没有读取实际代码或 diff，不允许给出审查意见。**

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "代码看起来没问题" | "看起来"不是证据。逐维度检查了吗？ |
| "没什么大问题，LGTM" | 没发现问题和没有问题是两回事。六个维度都过了吗？ |
| "我来重写一下更好" | 审查是指出问题，不是替人写代码。给建议，不给整段代码。 |

完整的 Red Flags 表和 Rationalizations 对照表见 [references/discipline-guard.md](./references/discipline-guard.md)。

## 反模式

### FAIL: 凭猜测给意见

```
审查结果：
- getUser() 可能有 null 安全问题
- 建议加错误处理
- 代码看起来不太好维护
```

→ 没有文件位置、没有代码证据、"可能""看起来"不是发现。

### PASS: 四要素完整

```
**[错误处理] getUser 返回值未判空** — `src/services/user.ts:47`
- Symptom: getUser() 可返回 null，但第 52 行直接访问 user.email
- Source: 边界输入未处理——null 是 getUser 的合法返回值
- Consequence: 用户不存在时抛 TypeError，请求 500
- Remedy: 加 null check 或改为 getUserOrThrow()
```

### FAIL: 审查变重写

```
你的 processOrder 写得不好，应该改成这样：
function processOrder(order) { ... } // 给出 30 行替代代码
```

→ 审查者的职责是指出问题，不是替人写代码。

### PASS: 指出问题 + 给方向

```
**[函数设计] processOrder 混合三个职责** — `src/order.ts:23`
- Symptom: 一个函数中混合了校验、计算和持久化
- Source: 单一职责原则——一个函数变更不应有三个不相关原因
- Consequence: 修改计算逻辑时可能破坏持久化，回归风险高
- Remedy: 按阶段拆分：validate → calculate → persist
```
