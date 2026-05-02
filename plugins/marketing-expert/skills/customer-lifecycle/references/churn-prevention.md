# 流失预防与挽留（churn-prevention）

## 适用场景
- 自愿流失率高，需要设计或优化取消流程和挽留策略。
- 非自愿流失严重，需要配置 dunning 序列和智能重试。
- 需要建立流失预测模型，提前干预高风险用户。

## 核心约束
- 流失分两类：自愿（50-70%）靠挽留流程；非自愿（30-50%）靠支付恢复。
- 取消流程必须合规，不能隐藏入口或强制电话取消（FTC 红线）。
- 挽留 offer 必须与退出原因匹配，禁止无差别打折。
- 先拉近 30 天取消原因分布，再决定 offer 优先级。

## 取消流设计
五步结构：`Trigger → Survey → Dynamic Offer → Confirmation → Post-Cancel`，整个流程不超过 3 步点击。详见 [cancel-flow-design](references/cancel-flow-design.md)。

## 退出调查
5-8 个单选原因：太贵了、用得不够多、缺少功能、换用竞品、技术问题、暂时不需要、公司关闭、其他（必填文本）。按历史占比降序排列，数据每月汇总反馈产品团队。

## 动态挽留策略
- 太贵了 → 20-30% 折扣（2-3 月）或降级
- 用得不够多 → 暂停 1-3 月（60-80% 回归率）
- 缺少功能 → 路线图展示 / beta 邀请
- 换用竞品 → 对比表 + 独家折扣
- 技术问题 → 支持升级（24h 内响应）
- Top 20% MRR 客户 → 人工外联优先

Offer cooldown 90 天，不重复打折。详见 [save-offers](references/save-offers.md)。

## 流失预测
风险信号：登录频率下降 50%+、核心功能 7 天未使用、访问 billing/取消页、数据导出。健康分 0-100（0-30 高风险触发自动干预）。

## 非自愿流失：支付恢复
- Pre-dunning：卡片到期前 30/15/7 天提醒 + Account Updater 自动更新卡号。
- 智能重试：soft decline 4h 后重试；hard decline 48h 后重试一次；过期卡不重试直接发邮件。
- Dunning 序列 4 封邮件 10 天完成，期间保持服务可用。

详见 [involuntary-churn](references/involuntary-churn.md)。

## 度量指标
- 月流失率：B2C < 5%，B2B < 2%
- 取消流挽留率：25-35%
- Dunning 恢复率：50-60%
- 暂停回归率：60-80%

## 检查清单
- [ ] 取消流程 3 步内完成，无隐藏入口
- [ ] 退出调查 5-8 个原因，数据按月汇总
- [ ] 每个退出原因有对应挽留 offer
- [ ] Top 20% MRR 客户走人工外联
- [ ] Offer 有 90 天 cooldown
- [ ] 健康分模型已部署，高风险自动触发干预
- [ ] Pre-dunning 卡片到期前 30 天开始
- [ ] Dunning 邮件 4 封 10 天内完成

## 反模式
- 隐藏取消按钮 → 用流程挽留而非阻拦
- 所有人统一打折 → 按退出原因匹配差异化 offer
- 支付失败立即断服 → graceful degradation + 10 天 dunning 窗口
- 不做退出调查 → 强制单选原因
- 重复给同一用户打折 → 90 天 cooldown + offer 历史记录
- 忽略非自愿流失 → pre-dunning + 智能重试 + Account Updater