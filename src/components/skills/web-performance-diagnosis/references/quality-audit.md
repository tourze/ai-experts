# 质量审计详细流程

## 问题分级

```md
P0：影响交易转化或 SEO 收录（LCP > 4s / 主 CTA 不可达）
P1：影响用户体验但不阻塞主流程（次级页面 a11y / 二级 SEO）
P2：质量打磨（细微对齐 / 文案润色）
```

## 审计报告格式

```markdown
## Findings

- P0 Performance: 首屏主视觉未预加载，LCP 受阻。
- P1 Accessibility: 图标按钮缺少可访问名称。
- P1 SEO: 标题层级和描述标签不完整。

自动扫描发现：
- Lighthouse a11y 92/100
- impeccable detect 命中 2 处 AI 指纹

人工复核发现（工具看不到）：
- 注册→支付流程缺 4 处确认态
- 错误文案"操作失败"没说为什么
```

## AI 设计指纹检测

补一步 [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0) CLI 扫描：

```bash
npx impeccable detect src/            # 扫目录
npx impeccable detect --json --fast . # 大项目快速模式
```

命中项标 **P0 阻塞**，禁止改颜色/宽度绕开——参考 [frontend-design-review/references/absolute-bans.md](../../frontend-design-review/references/absolute-bans.md) 的正确重写方案。

## 反模式

### FAIL: 只贴 Lighthouse 分数

```md
"Performance: 62 / 100，需要优化"
→ 没有具体动作可执行
```

### PASS: 根因 + 文件 + 动作

```md
P0 性能：LCP = 4.2s（目标 < 2.5s）
- 根因：hero 图 1.8MB + 未 preload（src/components/Hero.tsx:14）
- 动作：转 webp + fetchpriority="high" + 提前 <link preload>
- 预期：LCP → 1.8s
```

### FAIL: 全是 P1

所有问题同一优先级 = 没排，开发不知先修哪个。

### PASS: 影响 x 范围分级

按用户可见影响 x 修复成本排序，P0/P1/P2 分明。

### FAIL: 只跑工具不人工复核

Lighthouse 看不到：业务流程是否合理、文案是否通顺、状态是否完整。

### PASS: 工具 + 人工双轨

自动扫描发现 a11y/AI 指纹问题，人工复核发现流程/文案/状态问题。
