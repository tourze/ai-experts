# 行业反模式

评审产品设计时，按行业先过一遍"不该做什么"。踩中这些反模式 = 摧毁行业该有的情绪基线。

## Banking / Fintech

- 用 AI 紫粉渐变（符号化"廉价 AI 产品"，与"值得托付"冲突）
- 默认暗黑模式（金融主流用户期待明亮、稳定）
- 卡通图标或拟人吉祥物（削弱信任）
- 过度动效（带来不稳定感）
- 用红色做背景或大面积（红 = 亏损/警告，不能作为品牌色）
- hero 只有一句口号没有证据（缺信任锚点）

## Healthcare / Medical

- 默认深色模式（临床场景需要高对比、高可读性）
- 时髦/酷炫动效（与"我把健康交给你"对立）
- 小字号（老年用户无法阅读）
- 纯装饰插画占据核心区（遮挡关键任务入口）
- 用警告红做链接或次要操作（用户会误以为出错）
- 隐藏紧急联系入口（诊所、医院等场景）

## Legal / Professional Services

- 活泼亮色、Emoji 图标（降低权威感）
- 炫技动效、scroll hijacking（分散注意）
- Gen-Z 语气或口语化文案（不符合客户期待）
- 首屏缺少公司名、团队、资质（信任未建立就推销服务）
- 无安全/隐私说明（法律客户尤其敏感）

## Gen-Z / Youth Lifestyle

- 企业感圆角（4-8px）和温和配色（看起来像 SaaS）
- Stock 图 + Corporate 蓝（直接被划走）
- 过于干净的栅格（失去"自己做的感觉"）
- 没有贴纸、手写、歪斜等 raw 元素（套版 AI 感）
- 标准 CTA 按钮（Neubrutalism 风格该用粗边 + offset 阴影）

## Enterprise B2B SaaS

- Consumer App 气质（大圆角、卡通、emoji）
- hero 只有美图没有价值主张（买家要数据、客户 logo）
- 缺 Case Study / 客户 logo wall
- 缺 SSO / SOC2 / 安全合规说明
- 缺"联系销售"和"自助试用"双路径（企业买家需要选择）

## Healthcare + Wellness / Spa / Meditation

- 霓虹、高饱和（与放松体验冲突）
- 动效 < 200ms 或过强 spring（带来紧张感）
- 默认暗色 + 性冷淡感（削弱温暖）
- 股票医生微笑图（廉价感）

## E-commerce (General)

- 装饰色块遮挡商品（最重要的是商品本身）
- CTA 不醒目 / 多 CTA 争抢注意力
- 结算步骤不明（用户不知道还要多少步）
- 隐藏运费 / 退货政策（转化率杀手）

## Luxury E-commerce

- 密集网格、打折红标（降价感 = 奢侈品反义词）
- 小图 + 多商品平铺（奢品用大图 + 情境）
- 亮黄 / 橙 / 活力色（不符合奢侈气质）

## EdTech (Kids)

- 深蓝企业色、成人衬线字
- 小字号、密集信息
- 奖励机制缺失（儿童产品需要即时正反馈）

## Government / Public Service

- 品牌营销感、装饰性 hero
- 隐藏关键服务入口（缴税/预约/申报）
- 多语言支持弱（公共服务必须覆盖主要语言）
- 无障碍不达标（公共服务是强制要求）

## Web3 / Crypto

- 传统银行蓝、安心老年人感（与社群文化不符）
- 无钱包连接入口（核心身份）
- 无 on-chain 透明度（tx 链接、合约地址）

## AI / Copilot Product

- 把 AI = 魔法光（紫粉渐变、粒子爆炸）
- 模糊的"我们用 AI"却不说明做什么
- 缺可看见的产出样例（不给试用/demo）

## 跨行业硬规则（补充）

- Emoji 作图标（模糊、不一致、a11y 差、跨平台渲染不统一）
- 颜色是唯一信息通道（色盲不可用）
- 去掉默认 focus-visible（键盘用户不可用）
- placeholder 当唯一 label（a11y 和可用性双杀）

## 使用方式

评审前先扫一遍对应行业条目，再走 [product-design-critic](../SKILL.md) 的标准流程。如果行业在 [industry-design-presets](../../../../frontend-expert/skills/industry-design-presets/SKILL.md) 有 preset，两份对照查。

## 致谢

本清单参考了 `nextlevelbuilder/ui-ux-pro-max-skill` (MIT) 的 ui-reasoning.csv 的 Anti_Patterns 字段，内容经过重写、行业补充和情绪解释。
