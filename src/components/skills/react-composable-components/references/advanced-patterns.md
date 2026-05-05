# React 可组合组件 — 反模式详解

本文件是 react-composable-components SKILL.md 的拆分内容，包含反模式对比的完整代码。

## FAIL: 配置型 props 替代插槽

```tsx
<Card
  hasHeader headerTitle="Project"
  headerActions={<Button>Edit</Button>}
  hasFooter footerButtons={<><Button>Save</Button><Button>Cancel</Button></>}
  compact bordered shadow="lg"
/>
// 8 个 props 仍无法表达"标题里再嵌一个图标"
```

## PASS: 结构组合

```tsx
<Card>
  <CardHeader>
    <h2>Project</h2>
    <Button>Edit</Button>
  </CardHeader>
  <CardFooter>
    <Button>Save</Button>
    <Button variant="ghost">Cancel</Button>
  </CardFooter>
</Card>
// 任何嵌套结构都能直接表达
```

## FAIL: 不透传原生属性

```tsx
function MyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick}>{label}</button>;
}
// 调用方想加 aria-label / disabled / type="submit" → 全部丢失
```

## PASS: ...props 透传 + forwardRef

```tsx
const MyButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => (
    <button ref={ref} className={cn("base-styles", className)} {...props}>
      {children}
    </button>
  )
);
// 调用方完整继承 button 全部能力
```
