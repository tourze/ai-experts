---
name: gdpr-data-handling
description: 当需要设计 GDPR 合规流程、同意管理、数据主体请求或 breach 响应时使用。
---

# GDPR 数据处理

## 适用场景

- 设计或审查会处理欧盟个人数据的产品、后台服务、营销流程、客服流程、员工数据系统。
- 落地同意管理、数据主体请求、保留删除、跨境传输、供应商处理者管理与 breach 响应流程。
- 涉及雇员或候选人数据时，联动 [employment-contract-templates](../employment-contract-templates/SKILL.md)；需要把隐私问题升级成管理层法律风险时，联动 [legal-risk-assessment](../legal-risk-assessment/SKILL.md)。

## 核心约束

- 先确定 `lawful basis` 再设计数据模型；不要用“用户点了继续”替代合法性基础分析。
- 把目的、字段、保存期限、接收方、跨境传输与删除条件绑定到具体处理活动，不要只写一个总表。
- `special category data`、儿童数据、刑事定罪数据必须单独识别并提高控制等级；默认把它们和普通资料放同一路径是错误做法。
- 同意必须是自由、具体、知情且可撤回；预勾选、捆绑同意、以“继续使用”代替记录化同意都不合格。
- DSAR 响应时钟、删除例外、法律保留、审计日志与 breach 72 小时评估链路必须可操作，而不只是写在政策里。

## 代码模式

```javascript
export function appendConsentEvent(history, input) {
  const timestamp = input.timestamp ?? new Date().toISOString();
  return [
    ...history,
    {
      purpose: input.purpose,
      granted: Boolean(input.granted),
      source: input.source,
      policyVersion: input.policyVersion,
      timestamp,
    },
  ];
}

export function hasActiveConsent(history, purpose) {
  const latest = [...history]
    .filter((item) => item.purpose === purpose)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];

  return latest?.granted === true;
}
```

```python
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass(slots=True, frozen=True)
class DsRequest:
    request_type: str
    subject_id: str
    submitted_at: datetime
    verified: bool


def response_deadline(request: DsRequest, is_complex: bool = False) -> datetime:
    base_days = 30
    extension_days = 60 if is_complex else 0
    return request.submitted_at + timedelta(days=base_days + extension_days)


now = datetime.now(timezone.utc)
request = DsRequest("access", "user-123", now, verified=True)
deadline = response_deadline(request)
assert deadline > now
```

```markdown
# GDPR 处理活动最小记录

| 处理活动 | 合法性基础 | 数据字段 | 保存期限 | 接收方 | 跨境传输 | 退出条件 |
| --- | --- | --- | --- | --- | --- | --- |
| 用户注册 | 合同履行 | 姓名、邮箱、登录日志 | 账号存续期 + 180 天 | 身份验证供应商 | 否 / SCC | 注销完成且无法律保留 |
| 市场营销 | 同意 | 邮箱、偏好、活动点击 | 撤回同意后 30 天 | 邮件服务商 | 按 DPA/SCC | 用户撤回同意 |
| 客服工单 | 合法利益 | 工单内容、设备信息 | 3 年 | CRM 供应商 | 视供应商而定 | 处理结束且超保留期 |
```

## 检查清单

- 每一类处理活动是否已经记录合法性基础、处理目的、字段、保存期限、接收方和跨境传输机制。
- 同意流程是否支持独立勾选、版本留痕、撤回留痕和历史追溯，而不是只保留当前值。
- DSAR 是否有身份核验、单月时钟、复杂请求延期记录、拒绝理由模板和删除例外记录。
- 数据保留策略是否能区分活跃账号、关闭账号、营销撤回、法律保留和审计日志，而不是“一律永久保存”。
- 处理者协议、子处理者清单、RoPA、DPIA、跨境传输机制和 breach 响应联系人是否已经指定归档位置。
- 如果处理员工、候选人或离职人员数据，劳动文件、隐私告知和系统留存策略是否相互一致。

## 反模式

### FAIL: 同意当万能

```
所有处理都弹 cookie banner 收同意 → 合同履行/法定义务本不需同意；
营销和分析捆绑 → 撤回无法拆分
```

### PASS: 按 lawful basis 分流

```
合同履行 / 法定义务 / 合法利益（需 LIA） / 同意（独立勾选可撤回）
```

### FAIL: 删除只删主表

```
DELETE FROM users WHERE id=123 → 备份/CSV/工单/审计日志仍在
```

### PASS: 全链路清理

```
主表 + 备份（标记） + 数仓 + 日志 + 第三方 DPA，各自 ticket
法律保留项单独记录（财务/刑事证据保留）
```
