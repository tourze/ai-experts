# 仓库级威胁建模

## 适用场景
- 需要基于仓库证据输出针对性的威胁模型，而不是通用模板。
- 需要与 [stride-analysis-patterns](references/stride-analysis-patterns.md) 联动做系统性枚举。
- 产出威胁后，继续用 [threat-mitigation-mapping](references/threat-mitigation-mapping.md) 和 [security-requirement-extraction](references/security-requirement-extraction.md) 落地。

## 核心约束
- 所有组件、边界和控制都必须有仓库证据或明确假设来源。
- 区分运行时路径与 CI/构建/开发工具，避免把辅助脚本混进主系统边界。
- 威胁数量少而精，优先真实攻击者目标与高价值资产。
- 当关键上下文缺失时，先提 1 到 3 个高价值问题再定级。

## 代码模式
```markdown
# <repo>-threat-model.md
- 资产：用户数据、凭据、构建产物、审计日志
- 边界：浏览器 -> API 网关 -> 应用服务 -> 数据库
- 入口：HTTP API、上传接口、后台任务、管理员控制台
- 威胁：跨租户读取、令牌窃取、配置篡改、资源耗尽
```

## 检查清单
- 是否列出资产、边界、入口、攻击者能力和主要假设。
- 每条威胁是否绑定具体入口和受影响资产。
- 优先级是否说明可能性、影响和现有控制。
- 结论是否明确区分证据、推断和待确认项。

## 反模式

### FAIL: 没有证据直接套模板

```markdown
# 威胁模型
- 威胁1：SQL 注入（因为有数据库）
- 威胁2：XSS（因为有前端）
- 威胁3：CSRF（因为有表单）
```

→ 没有引用任何仓库文件、路由或配置，纯靠假设堆砌。

### PASS: 基于仓库证据逐条建模

```markdown
# 威胁模型
- 资产：用户 PII（src/models/user.ts:12 存储 email + phone）
- 入口：POST /api/upload（src/routes/upload.ts:34，未校验 Content-Type）
- 威胁：任意文件上传导致 RCE
  - 证据：multer 配置未限制文件类型（src/middleware/upload.ts:8）
  - 现有控制：无
  - 优先级：高（可利用性高 + 影响大）
```

### FAIL: 不区分运行时与工具链

```markdown
- 威胁：scripts/seed.ts 存在硬编码密码 → 严重
```

→ seed 脚本仅在开发环境运行，不是运行时攻击面。

### PASS: 明确标注路径类型

```markdown
- 运行时入口：POST /api/auth/login（生产环境暴露）→ 高优先级
- 开发工具：scripts/seed.ts（仅本地，不进入构建产物）→ 风险降级为低
```
