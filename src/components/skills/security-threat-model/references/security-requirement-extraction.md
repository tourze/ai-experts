
# 安全需求提炼

## 适用场景
- 已经有威胁、控制缺口或合规约束，需要整理为需求、验收标准和测试点。
- 如果还没有威胁基础，先用 [security-threat-model](../SKILL.md) 或 [stride-analysis-patterns](./stride-analysis-patterns.md)。
- 需求落地前，可与 [threat-mitigation-mapping](./threat-mitigation-mapping.md) 对齐控制选择。

## 核心约束
- 每条需求只表达一个控制意图，并绑定具体威胁或风险。
- 验收标准必须可测试、可审计，避免“系统应足够安全”之类空话。
- 区分功能需求、平台控制、流程控制和监控告警。
- 没有威胁来源或责任归属的需求，默认质量不足。

## 代码模式
```markdown
## SR-001 会话令牌轮换
- 来源威胁：未失效旧令牌导致会话固定
- 需求：用户登录成功后必须轮换会话令牌
- 验收标准：登录前后令牌不同；退出后旧令牌不可复用
- 测试点：正常登录、并发标签页、退出后重放
```

## 检查清单
- 需求是否绑定威胁、资产、责任人和优先级。
- 验收标准是否能直接变成测试用例。
- 是否区分必须立即修复与版本化落地的项。
- 合规映射是否和实际控制内容一致。

## 反模式

### FAIL: 泛泛需求

```md
SR-XXX：系统应足够安全
SR-XXX：加强密码校验
SR-XXX：注意防止 XSS
→ 工程师不知道做什么，QA 不知道测什么
```

### PASS: 单一控制 + 可测试

```md
## SR-001 注册接口密码强度
- 来源威胁：弱密码导致离线暴力破解（src/threat-model.md#T-12）
- 需求：注册时密码必须满足至少 8 字符 + 1 数字 + 1 特殊字符
- 验收标准：
  - "abc12345" → 拒绝（无特殊字符）
  - "Abc!2345" → 通过
- 测试点：
  - 单元测试 PasswordValidator.test.ts 覆盖 6 种边界
  - E2E：POST /register 含弱密码 → 422
- 责任人：@auth-team
- 优先级：P0（合规要求）
```

### FAIL: 没有验收标准

```md
SR-002：会话令牌应该轮换
→ 多久轮换一次？什么场景？怎么验证？
→ 工程实现 1 小时轮换一次，QA 一次也没测
```

### PASS: 验收 = 可测试断言

```md
SR-002：登录成功后必须立即轮换会话令牌
- 验收 1：POST /login 前后 cookie["sid"] 值不同
- 验收 2：登录后用旧 sid 请求 /me → 401
- 验收 3：登出后用任一历史 sid → 401
- E2E 测试文件：tests/auth/session-rotation.spec.ts
```

### FAIL: 抄缓解当需求

```md
威胁文档说"加 WAF" → 需求文档照抄"上线 WAF"
→ 没说覆盖哪些路径、规则集是什么、监控阈值多少
→ 一年后仍是空话
```

### PASS: 需求 = 目标 + 范围 + 验证

```md
SR-003：核心 API 必须接入 WAF 拦截 OWASP Top 10
- 范围：/api/v1/* 全部 routes（不含 /health, /metrics）
- 规则集：OWASP CRS 4.0
- 验证：用 OWASP nettacker 测试 → 100% 拦截 SQLi/XSS/RCE 主流 payload
- 监控：拦截事件入 Datadog dashboard，>10/min 告警
```
