# 反模式与正确做法

## 需求确认

**FAIL**: 跳过确认直接生成 → 观众/风格不对，全部返工。

**PASS**: 先完成八项确认 → spec_lock → 大纲确认 → 逐页生成。

## 逐页生成

**FAIL**: 一次性输出 15 页 SVG → 第 10 页起风格漂移（字号变小、配色偏移）。

**PASS**: 每页生成前重读 spec_lock + 检查 page_rhythm → 15 页风格一致。

## 节奏编排

**FAIL**: 6 页连续 dense → 第 4 页起观众走神，信息过载。

**PASS**: dense 不超过连续 3 页，穿插 breathing/anchor：
```
cover(anchor) → agenda(breathing) → problem(dense) → data(dense)
→ quote(breathing) → solution(dense) → section(anchor) → ...
```

## SVG 规范

**FAIL**:
```svg
<style>.title { font-size: 48px; }</style>
<foreignObject><div class="title">标题</div></foreignObject>
```
→ 转换失败。

**PASS**:
```svg
<svg viewBox="0 0 960 540" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="960" height="540" fill="#1B3A5C"/>
  <text x="480" y="270" font-size="48" font-family="Inter"
        fill="#FFFFFF" text-anchor="middle">标题</text>
</svg>
```
