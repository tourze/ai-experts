## 审查强度

用户未指定时默认标准模式。高压模式详情见 [references/brutal-mode.md](./references/brutal-mode.md)。

| 模式 | 触发信号 | 适用场景 |
|------|---------|---------|
| **标准** | "review 一下""帮我看看这段代码" | 日常 PR、常规审查 |
| **高压** | "狠狠 review""别留情""直接指出烂在哪里" | 资深团队、高风险模块 |

高压模式只攻击工作产物，不攻击作者人格。无授权不对新人/低心理安全团队使用。

## 审查维度
读取 [references/dimensions.md](./references/dimensions.md)，按六维度逐项检查：命名与语义、函数设计、错误处理、逻辑与边界、DRY 与抽象、可读性。

## 纪律守卫

**Iron Law：没有读取实际代码或 diff，不允许给出审查意见。**

| 危险念头 | 现实 |
|---------|------|
| "代码看起来没问题" | "看起来"不是证据。逐维度检查了吗？ |
| "没什么大问题，LGTM" | 没发现问题和没有问题是两回事 |
| "我来重写一下更好" | 审查是指出问题，给建议不给整段代码 |

完整 Red Flags 见 [references/discipline-guard.md](./references/discipline-guard.md)。

## 自动化评估工具

可在审查前用 CLI 脚本做预扫描，获取结构化发现后再进入人工审查：

- `procedure code-review-assess-code <target>` — 代码质量预扫描（TODO 检测、文件分析、严重度分级）
- `procedure code-review-assess-tests <test-dir>` — 测试质量预扫描（测试文件发现、套件运行、质量评估）
