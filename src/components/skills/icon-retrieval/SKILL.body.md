## 代码模式

```bash
node ./scripts/search.mjs 'document upload' 5
```

```json
{
  "query": "document upload",
  "topK": 5,
  "count": 2,
  "results": [
    {
      "url": "https://example.com/icon.svg",
      "svg": "<svg ...>...</svg>"
    }
  ]
}
```

```tsx
// 使用前先把 SVG 放进统一 Icon 包装器，而不是在页面里到处内联。
<Icon size="md" color="var(--color-text-primary)" dangerouslySetInnerHTML={{ __html: svg }} />
```

## 检查清单

- [ ] 搜索词足够具体，已拿到 3-5 个可比较候选。
- [ ] `topK` 设定合理，没有盲目拉取过多结果。
- [ ] SVG 已经过滤、压缩或纳入项目统一图标组件。
- [ ] 图标尺寸、线宽、圆角和视觉风格与现有系统一致。
- [ ] 图标语义明确，不会误导用户。

## 反模式

### FAIL: 宽泛关键词

```bash
node ./scripts/search.mjs 'icon' 5
# 返回 5 个完全不相关的图标：齿轮、相机、闹钟、心形、文件夹
```

### PASS: 业务语义词

```bash
node ./scripts/search.mjs 'document upload cloud' 5
# 返回 5 个上传/云端相关的语义对齐图标，可直接对比
```

### FAIL: 混线宽混风格

```tsx
<HeartFilled />        {/* 实心 24px */}
<SettingsOutline />    {/* 描线 1.5px 20px */}
<UserDuotone />        {/* 双色 16px */}
// 同一工具栏三种风格，视觉系统崩溃
```

### PASS: 锁定单一图标系

```tsx
// 全局只用 lucide outline 1.5px，size token 控制
<Heart className="w-5 h-5" />
<Settings className="w-5 h-5" />
<User className="w-5 h-5" />
```

### FAIL: 装饰图标无文字

```tsx
<button onClick={deleteItem}>
  <TrashIcon />
</button>
// 屏幕阅读器：仅读"按钮"，用户不知道点完会删什么
```

### PASS: aria-label + 视觉图标

```tsx
<button onClick={deleteItem} aria-label="删除任务">
  <TrashIcon aria-hidden="true" />
</button>
// 视觉用户看图标，屏幕阅读器读"删除任务，按钮"
```

## 参考资料

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [figma-implement-design](../figma-implement-design/SKILL.md)
- [scripts/search.mjs](scripts/search.mjs)
