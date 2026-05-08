# 事件分类指南

命名约定、事件结构和参数标准的完整参考。

---

## 为什么分类很重要

埋点数据的质量取决于命名的一致性。一个系统中同时存在 `FormSubmit`、`form_submit`、`form-submitted` 和 `formSubmitted` 作为四个独立"事件"，对聚合毫无价值。从一开始就强制执行统一的命名标准，可以避免后续数月的数据清理工作。

本指南即该标准的参考文档。

---

## 命名约定：完整规范

### 格式

```
[对象]_[动作]
```

**对象** = 被操作的事物（名词）
**动作** = 发生了什么（动词，过去时或动名词）

### 大小写与字符

| 规则 | ✅ 正确 | ❌ 错误 |
|------|---------|---------|
| 仅小写 | `video_started` | `Video_Started`，`VIDEO_STARTED` |
| 仅下划线 | `form_submit` | `form-submit`，`formSubmit` |
| 名词在前 | `plan_selected` | `selected_plan` |
| 过去时或明确状态 | `checkout_completed` | `checkout_complete`，`checkoutDone` |
| 具体优先于通用 | `trial_started` | `event_triggered` |
| 最多 4 个词 | `onboarding_step_completed` | `user_completed_an_onboarding_step_in_the_flow` |

### 动作词汇（标准动词）

始终使用这些动词——不要发明同义词：

| 动词 | 用途 |
|------|------|
| `_started` | 多步骤流程的开始 |
| `_completed` | 流程成功完成 |
| `_failed` | 尝试出错 |
| `_submitted` | 表单或数据提交 |
| `_viewed` | 页面、弹窗或内容的被动查看 |
| `_clicked` | 直接点击特定元素 |
| `_selected` | 从选项中选择（方案、变体、筛选器） |
| `_opened` | 弹窗、抽屉、聊天窗口打开 |
| `_closed` | 弹窗、抽屉、聊天窗口关闭 |
| `_downloaded` | 文件下载 |
| `_activated` | 功能首次开启 |
| `_upgraded` | 方案或功能升级 |
| `_cancelled` | 主动终止 |
| `_dismissed` | 用户明确关闭/忽略提示 |
| `_searched` | 提交搜索查询 |

---

## 完整 SaaS 事件目录

### 获客事件

| 事件 | 必需参数 | 可选参数 |
|------|---------|---------|
| `ad_clicked` | `utm_source`，`utm_campaign` | `utm_content`，`utm_term` |
| `landing_page_viewed` | `page_location`，`utm_source` | `variant`（A/B） |
| `pricing_viewed` | `page_location` | `referrer_page` |
| `demo_requested` | `source`（页面 slug 或区块） | `plan_interest` |
| `content_downloaded` | `content_name`，`content_type` | `gated`（布尔值） |

### 获客 → 注册

| 事件 | 必需参数 | 可选参数 |
|------|---------|---------|
| `signup_started` | — | `plan_name`，`method` |
| `signup_completed` | `method` | `user_id`，`plan_name` |
| `email_verified` | — | `method` |
| `trial_started` | `plan_name` | `trial_length_days` |
| `invitation_accepted` | `inviter_user_id` | `plan_name` |

### 引导事件

| 事件 | 必需参数 | 可选参数 |
|------|---------|---------|
| `onboarding_started` | — | `onboarding_variant` |
| `onboarding_step_completed` | `step_name`，`step_number` | `time_spent_seconds` |
| `onboarding_completed` | `steps_total` | `time_to_complete_seconds` |
| `onboarding_skipped` | `step_name` | `step_number` |
| `feature_activated` | `feature_name` | `activation_method` |
| `integration_connected` | `integration_name` | `integration_type` |
| `team_member_invited` | — | `invite_method` |

### 转化事件

| 事件 | 必需参数 | 可选参数 |
|------|---------|---------|
| `plan_selected` | `plan_name`，`billing_period` | `previous_plan` |
| `checkout_started` | `plan_name`，`value`，`currency` | `billing_period` |
| `checkout_completed` | `plan_name`，`value`，`currency`，`transaction_id` | `billing_period`，`coupon_code` |
| `checkout_failed` | `plan_name`，`error_reason` | `value`，`currency` |
| `upgrade_completed` | `from_plan`，`to_plan`，`value`，`currency` | `trigger` |
| `coupon_applied` | `coupon_code`，`discount_value` | `plan_name` |

### 互动事件

| 事件 | 必需参数 | 可选参数 |
|------|---------|---------|
| `feature_used` | `feature_name` | `feature_area`，`usage_count` |
| `search_performed` | `search_term` | `results_count`，`search_area` |
| `filter_applied` | `filter_name`，`filter_value` | `result_count` |
| `export_completed` | `export_type`，`export_format` | `record_count` |
| `report_generated` | `report_name` | `date_range` |
| `notification_clicked` | `notification_type` | `notification_id` |

### 留存事件

| 事件 | 必需参数 | 可选参数 |
|------|---------|---------|
| `subscription_cancelled` | `cancel_reason` | `plan_name`，`save_offer_shown`，`save_offer_accepted` |
| `save_offer_accepted` | `offer_type` | `plan_name`，`discount_pct` |
| `subscription_paused` | `pause_duration_days` | `pause_reason` |
| `subscription_reactivated` | — | `plan_name`，`days_since_cancel` |
| `churn_risk_detected` | — | `risk_score`，`risk_signals` |

### 支持 / 帮助事件

| 事件 | 必需参数 | 可选参数 |
|------|---------|---------|
| `help_article_viewed` | `article_name` | `article_id`，`source` |
| `chat_opened` | — | `page_location`，`trigger` |
| `support_ticket_submitted` | `ticket_category` | `severity` |
| `error_encountered` | `error_type`，`error_message` | `page_location`，`feature_name` |

---

## 自定义维度与指标

GA4 限制：50 个自定义维度（事件级别），25 个用户级别，50 个项目级别。优先对分割分析重要的维度。

### 推荐的用户级别维度

| 维度名 | 参数 | 示例值 |
|--------|------|--------|
| 用户 ID | `user_id` | `usr_abc123` |
| 方案名称 | `plan_name` | `starter`，`professional`，`enterprise` |
| 结算周期 | `billing_period` | `monthly`，`annual` |
| 账号创建日期 | `account_created_date` | `2024-03-15` |
| 引导完成 | `onboarding_completed` | `true`，`false` |
| 公司规模 | `company_size` | `1-10`，`11-50`，`51-200` |

### 推荐的事件级别维度

| 维度名 | 参数 | 用于 |
|--------|------|------|
| 取消原因 | `cancel_reason` | `subscription_cancelled` |
| 功能名称 | `feature_name` | `feature_used`，`feature_activated` |
| 内容名称 | `content_name` | `content_downloaded` |
| 注册方式 | `method` | `signup_completed` |
| 错误类型 | `error_type` | `error_encountered` |

---

## 分类治理

### 埋点计划文档

维护一个统一的埋点计划文档（Google 表格或 Notion 表格），包含：

| 列 | 值 |
|----|-----|
| 事件名 | 例如 `checkout_completed` |
| 触发条件 | "用户完成 Stripe 结账" |
| 参数 | `{value, currency, plan_name, transaction_id}` |
| 实现方式 | GTM / 应用代码 / 服务端 |
| 状态 | 草稿 / 已实现 / 已验证 |
| 负责人 | 工程 / 市场 / 产品 |

### 变更协议

1. 新事件 → 先在埋点计划中添加，获得批准后再实施
2. 重命名事件 → 使用废弃过渡期（保留旧的 + 添加新的 30 天，然后移除旧的）
3. 移除事件 → 在埋点计划中归档，不要删除——历史数据需要引用
4. 添加参数 → 非破坏性，立即实现并更新埋点计划
5. 移除参数 → 按重命名处理（废弃过渡期）

### 版本管理

如果分类体系快速演进，在关键事件中包含 `schema_version` 参数：

```javascript
window.dataLayer.push({
  event: 'checkout_completed',
  schema_version: 'v2',
  value: 99,
  currency: 'USD',
  // ...
});
```

这允许在迁移期间区分新旧 schema。
