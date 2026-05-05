## 代码模式
```bash
node scripts/user_story_generator.mjs
node scripts/user_story_generator.mjs sprint 30
```

```markdown
用户故事：作为<角色>，我想要<动作>，以便<收益>
验收标准：Given <前置条件> When <动作> Then <结果>
```

## 反模式

### FAIL: Epic 当 Story

```
"用户管理系统重构" → 进 Sprint
→ 4 周后只完成 30%，无法 demo
```

### PASS: 拆到 INVEST

```
Epic: 用户管理系统重构
└─ Story 1: 用户列表分页（1 sprint 可完成）
└─ Story 2: 用户导出 CSV（1 sprint 可完成）
└─ Story 3: 批量禁用（1 sprint 可完成）
```

### FAIL: 无边界需求

```
"提升体验"
"支持更多场景"
→ 没有验收标准，永远不知道做完没
```

### PASS: 可测试 AC

```
Given 用户在订单页
When 点击"导出"
Then 30 秒内下载 CSV，含本月所有订单字段
```
