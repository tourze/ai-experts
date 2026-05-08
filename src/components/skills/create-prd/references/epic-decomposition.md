
# Epic 分解

## 适用场景
- 季度规划或路线图细化，需要把 Epic 拆成可排期的用户故事。
- Epic 跨越多个 Sprint，团队无法估算或承诺。
- 与 [user-story-patterns](./user-story-patterns.md) 配合写拆分后的用户故事，与 [agile-product-owner](../../agile-product-owner/SKILL.md) 配合做 Sprint 规划。
- 9 种分解模式详见 [decomposition-patterns](./epic-decomposition-patterns.md)。

## 核心约束
- 先明确 Epic 的**用户目标和成功指标**，再决定分解策略；没有目标的 Epic 先补目标。
- 每种分解模式产出的子故事必须各自有**独立可交付的用户价值**。
- 分解后必须回答"第一个可发布的最小子集是什么"（Walking Skeleton）。
- 先拆成 3-7 个中等故事，过细的拆分留给 Sprint Planning。

## 代码模式

### 分解模式速查

用户旅程 | 角色/Persona | 业务规则 | 数据/平台 | 性能/质量 | CRUD | 时间/频率 | 依赖解耦 | Walking Skeleton。详见 [decomposition-patterns](./epic-decomposition-patterns.md)。

### 分解质量评估

```markdown
| 检查项 | 红灯信号 |
|---|---|
| 独立价值 | "做完 A 才能看到 B 的效果" |
| 覆盖完整 | 拆完发现漏了关键场景 |
| 粒度均匀 | 一个 2 天，一个 3 周 |
| 可排序 | "都很重要，必须一起做" |
| 最小发布 | "至少做完 8 个才能用" |
```

## 检查清单
- [ ] Epic 有明确的用户目标和成功指标。
- [ ] 选择了合适的分解模式并说明理由。
- [ ] 子故事各自有独立用户价值，通过 INVEST 检查。
- [ ] 已识别 Walking Skeleton（最小可发布子集）。

## 反模式

### FAIL: 按技术组件拆 Epic

```
Epic: 用户能在线预约会议室
拆分：数据库表 | 后端 API | 前端页面 | 测试
→ 每条无法独立交付用户价值，前 3 条做完才能 demo
```

### PASS: 按用户旅程拆

```
拆分：
1. 查看会议室空闲状态
2. 预约一个时段
3. 取消自己的预约
4. 预约前 15 分钟收到提醒
Walking Skeleton: #1 + #2 = 最小可用版本
```

### FAIL: 拆太细

```
Epic: 用户注册 → 拆成 7 条（显示表单、验证邮箱、验证密码...）
→ 每条 0.5 天，管理成本 > 开发成本
```

### PASS: 合理粒度

```
1. 邮箱+密码注册并收到验证邮件（核心流程）
2. 第三方账号注册（扩展渠道）
3. 注册后引导完成个人资料（激活优化）
→ 3 条故事，每条 2-3 天
```
