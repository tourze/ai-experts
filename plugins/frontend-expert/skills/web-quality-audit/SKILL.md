---
name: web-quality-audit
description: 当用户提到审计网站质量、跑 Lighthouse、检查页面问题或优化网站体验时使用。
---

# Web 质量审计

## 适用场景

- 需要对站点或页面做全面质量体检。
- 需要把问题按严重级别输出给开发或产品。
- 需要快速扫描 HTML 页面的基础质量问题。
- 需要结合 Lighthouse、人工审查和代码检查给出整改顺序。

## 核心约束

- 审计结果必须先给问题，再给总结；按严重级别排序。
- 性能、可访问性、SEO、最佳实践四个维度都要覆盖，不能只看 Lighthouse 分数。
- 实验室结果用于定位，是否修好要看真实场景验证。
- 快速 HTML 扫描可用 `scripts/analyze.sh`，但它不是完整替代人工审计。
- 审计发现若落在交互和视觉层级问题上，要联动 [frontend-design-review](../frontend-design-review/SKILL.md)。

## 代码模式

```bash
bash ./scripts/analyze.sh ./public
bash ./scripts/analyze.sh ./index.html
```

```json
{
  "issues": ["Missing viewport meta tag"],
  "warnings": ["Found 1 image(s) without alt text"],
  "issueCount": 1,
  "warningCount": 1
}
```

```markdown
## Findings

- P0 Performance: 首屏主视觉未预加载，LCP 受阻。
- P1 Accessibility: 图标按钮缺少可访问名称。
- P1 SEO: 标题层级和描述标签不完整。
```

## 检查清单

- [ ] 已覆盖性能、可访问性、SEO、最佳实践四个维度。
- [ ] 问题按 P0/P1/P2 或等价等级排序。
- [ ] 每条问题都指向具体页面、文件或元素。
- [ ] 已说明哪些结论来自自动扫描，哪些来自人工判断。
- [ ] 审计建议可落地，而不是泛泛而谈。

## 反模式

### FAIL: 只贴 Lighthouse 分数

```md
"Performance: 62 / 100，需要优化"
→ 客户："优化什么？"
→ 没有具体动作可执行
```

### PASS: 根因 + 文件 + 动作

```md
P0 性能：LCP = 4.2s（目标 < 2.5s）
- 根因：hero 图 1.8MB + 未 preload（src/components/Hero.tsx:14）
- 动作：转 webp + fetchpriority="high" + 提前 <link preload>
- 预期：LCP → 1.8s（基于 1.2MB → 280KB 测算）
```

### FAIL: 全是 P1

```md
- 缺 alt 文本（P1）
- LCP 慢（P1）
- 字号小（P1）
- title 缺失（P1）
→ 等于没排，开发不知先修哪个
```

### PASS: 影响 × 范围分级

```md
P0：影响交易转化或 SEO 收录（LCP > 4s / 主 CTA 不可达）
P1：影响用户体验但不阻塞主流程（次级页面 a11y / 二级 SEO）
P2：质量打磨（细微对齐 / 文案润色）
```

### FAIL: 只跑工具不人工复核

```bash
npx lighthouse https://...  # 输出 95 分
"全绿了，没问题"
# 但 Lighthouse 看不到：业务流程是否合理、文案是否通顺、状态是否完整
```

### PASS: 工具 + 人工双轨

```md
自动扫描发现：
- Lighthouse a11y 92/100
- impeccable detect 命中 2 处 AI 指纹

人工复核发现（工具看不到）：
- 注册→支付流程缺 4 处确认态
- 错误文案"操作失败"没说为什么
- 价格表 mobile 横向滚动溢出（工具未触发）
```

## 额外静态扫描：AI 设计指纹

Lighthouse 不检测"AI 味"。补一步 [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0) 的 CLI 扫描，25 条规则覆盖 side-tab border、gradient text、AI color palette、nested cards、bounce easing 等模式：

```bash
npx impeccable detect src/            # 扫目录
npx impeccable detect --json --fast . # 大项目快速模式
```

命中项标 **P0 阻塞**，禁止改颜色/宽度绕开——参考 [frontend-design-review/references/absolute-bans.md](../frontend-design-review/references/absolute-bans.md) 的正确重写方案。

## 参考资料

- [core-web-vitals](../core-web-vitals/SKILL.md)
- [web-design-guidelines](../web-design-guidelines/SKILL.md)
- [frontend-design-review](../frontend-design-review/SKILL.md)
- [frontend-design-review/references/absolute-bans.md](../frontend-design-review/references/absolute-bans.md) — AI 指纹 CSS 模式禁令
- [scripts/analyze.sh](scripts/analyze.sh)
