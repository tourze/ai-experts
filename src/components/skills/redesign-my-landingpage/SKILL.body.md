## 代码模式
- 参考现成示例资产： [LandingPage.tsx](assets/vite-shadcn-iconify-landing/src/pages/LandingPage.tsx)。
- 最小实现模式：

```tsx
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'

<Button>
  Start free
  <Icon icon="lucide:arrow-right" className="ml-2 size-4" />
</Button>
```

- 页面结构与风格方向优先参考 [landing-page-anatomy](references/landing-page-anatomy.md)、[section-templates](references/section-templates.md)、[aesthetic-directions](references/aesthetic-directions.md)、[shadcn-vite-setup](references/shadcn-vite-setup.md)。

## 反模式

### FAIL: shadcn 模板拼装

```tsx
<Hero/>
<Features/>
<Testimonials/>
<Pricing/>
<FAQ/>
<CTA/>
// 每块都是 shadcn 默认 → 看起来和 100 个落地页一样
```

### PASS: 业务驱动结构

```tsx
<Hero
  headline=”销售每周省 6 小时”  // 具体数字
  subheadline=”自动化 ROAS 报表 + 多账户对账”
  cta=”14 天免费试用”
  visual={<ProductScreenshot/>}  // 产品真实截图
/>
<ProofRow logos={realCustomerLogos}/>
<HowItWorks steps={3} />  // 3 步而非 7 步
<Pricing tiers={2} />  // 2 个套餐 + 联系销售，不是 5 个 tier
<FinalCTA />
```

### FAIL: 抽象大词

```
“颠覆性 AI 平台”
“赋能企业增长”
“领先的解决方案”
→ 用户：”这做什么？”
```

### PASS: 具体动词 + 数字

```
“销售用我们 → 平均每周省 6 小时”
“30 秒接入 Salesforce / HubSpot”
“已服务 500+ 团队，月活 1.2w”
→ 一眼可懂
```
