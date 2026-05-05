# 代码审查

## 审查强度

用户未指定时默认标准模式。高压模式详情见 [references/brutal-mode.md](./references/brutal-mode.md)。

| 模式 | 触发信号 | 适用场景 |
|------|---------|---------|
| **标准** | "review 一下""帮我看看这段代码" | 日常 PR、常规审查 |
| **高压** | "狠狠 review""别留情""直接指出烂在哪里" | 资深团队、高风险模块 |

高压模式只攻击工作产物，不攻击作者人格。无授权不对新人/低心理安全团队使用。

## 适用场景
- 用户提交代码或文件，要求找出逻辑和设计层面的问题。
- 关注"代码写得好不好"，不是"能不能上线"（那用 `pre-landing-review`）。
- 交叉引用：降低复杂度配合 `complexity-reducer`；测试质量审查配合 `test-quality-review`。

## 核心约束

**违反字面规则 = 违反规则精神。不存在"灵活变通"。**

- 先读真实代码或 diff，不凭猜测。
- 不审查纯风格问题（缩进、括号、行长度）——那是 linter 的事。
- 每条发现必须遵循 **Iron Law 四要素**：Symptom → Source → Consequence → Remedy，缺一不可。
- 按严重度分级：🔴 关键 > 🟡 重要 > 🟢 建议。参考 [references/dimensions.md](./references/dimensions.md) 的严重度指引和"不应标记"规则。
- 审查结束输出 **Health Score**（100 分制），格式见 [references/health-score.md](./references/health-score.md)。
- 无问题则明确说明，不硬凑——100 分是合法的。

## 审查维度
读取 [references/dimensions.md](./references/dimensions.md)，按六维度逐项检查：命名与语义、函数设计、错误处理、逻辑与边界、DRY 与抽象、可读性。

## 检查清单
- [ ] 已确认审查强度（标准/高压）
- [ ] 已读取实际代码或 diff
- [ ] 每条发现含四要素
- [ ] 按严重度分级，参考了各维度指引
- [ ] 检查了"不应标记"规则，未误报
- [ ] 计算并输出 Health Score
- [ ] 未混入 linter 能抓的风格问题
- [ ] 高压模式：每条批评有证据 + 修复方向，未攻击作者人格

## 纪律守卫

**Iron Law：没有读取实际代码或 diff，不允许给出审查意见。**

| 危险念头 | 现实 |
|---------|------|
| "代码看起来没问题" | "看起来"不是证据。逐维度检查了吗？ |
| "没什么大问题，LGTM" | 没发现问题和没有问题是两回事 |
| "我来重写一下更好" | 审查是指出问题，给建议不给整段代码 |

完整 Red Flags 见 [references/discipline-guard.md](./references/discipline-guard.md)。

## 反模式

### FAIL: 凭猜测
"getUser() 可能有 null 安全问题 / 建议加错误处理" → 没有文件位置、没有代码证据。

### PASS: 四要素完整
```
**[错误处理] getUser 返回值未判空** — `src/services/user.ts:47`
- Symptom: getUser() 可返回 null，但第 52 行直接访问 user.email
- Source: 边界输入未处理——null 是 getUser 的合法返回值
- Consequence: 用户不存在时抛 TypeError，请求 500
- Remedy: 加 null check 或改为 getUserOrThrow()
```

### FAIL: 审查变重写
给出 30 行替代代码 → 审查者的职责是指出问题，不是替人写代码。

### PASS: 指出问题 + 给方向
```
**[函数设计] processOrder 混合三个职责** — `src/order.ts:23`
- Symptom: 一个函数中混合了校验、计算和持久化
- Remedy: 按阶段拆分：validate → calculate → persist
```

高压模式反模式见 [references/brutal-mode.md](./references/brutal-mode.md)。

## 自动化评估工具

可在审查前用 CLI 脚本做预扫描，获取结构化发现后再进入人工审查：

- `node scripts/assess-code.mjs <target>` — 代码质量预扫描（TODO 检测、文件分析、严重度分级）
- `node scripts/assess-tests.mjs <test-dir>` — 测试质量预扫描（测试文件发现、套件运行、质量评估）
