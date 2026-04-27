# 完整页面骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>主题</title>
  <style>/* Read 读入 assets/base.css 原样嵌入 */</style>
</head>
<body>
<div class="c">
  <h1>主题</h1>
  <p class="sub">一句话概括</p>
  <div class="toc">...</div>

  <h2 id="s1">1. 是什么</h2>
  <p>正文段落...</p>
  <svg width="100%" viewBox="0 0 700 200">...</svg>

  <h2 id="s2">2. 怎么工作</h2>
  <p>正文...</p>
  <div class="w"><!-- assets/animation-html.html 选一个骨架 --></div>

  <h2 id="sN">N. 总结</h2>
  <p>回顾...</p>
</div>
<script>/* assets/boilerplate.js 工具 + 选定模板 + 自己的 steps */</script>
</body>
</html>
```

## 嵌入顺序

1. `assets/base.css` → 原样放入 `<style>`，不改骨架；定制在骨架后追加覆盖规则。
2. `assets/animation-html.html` → 选一个结构（1/2/3），把所有 `xx-*` id 替换为实际前缀（如 `heap-push-svg`、`heap-push-arr`），同页多个动画用不同前缀隔离。
3. `assets/boilerplate.js` → 按需嵌入，**绝对不要整文件复制**：
   - 工具函数块（`treePos` / `mkDots` / `D`）—— 所有动画必嵌
   - `hlLines` —— 涉及代码联动时必嵌
   - 模板 A / B / C —— **三选一**，模板 A 和 C 都声明顶层 `var steps`，一起嵌入会重复声明报错
   - 键盘导航 —— 所有动画页面建议加
4. 自己的 `steps` 数据 + `clsFn(i)`（模板 A 必需）/ 驱动层（模板 B 必需）。

## 写入策略（防 stream loss）

单文件 HTML 通常 300-600 行，一次性写入容易因网络断流丢失。**必须分阶段**：

1. **告知用户整体计划**：列出页面将包含哪些章节、几个动画、预计总行数。
2. **分块写入**：
   - 第 1 块：HTML 骨架 + CSS（Read 读入 `assets/base.css`）+ 前 1-2 章静态内容。
   - 第 2 块：用 Edit 追加中段章节（含静态 SVG）。
   - 第 3 块：用 Edit 追加交互动画区块（HTML 部分）。
   - 第 4 块：用 Edit 追加 `<script>`（嵌入 boilerplate 工具 + 选定模板 + steps 数据 + 键盘导航）。
3. **每完成一块告知进度**，便于用户在断流时定位。
