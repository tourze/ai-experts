## 核心流程 — 6 阶段，4 个硬停点

```
阶段 1: 轻量需求确认 [HARD STOP]
  收集：用途、受众、页数/时长、材料状态、真实身份锚点、交付偏好
  输出：baseline judgment；不要一开始就要求用户填写完整设计参数表

阶段 1.5: 内容基底
  材料薄：先写 content_basis.md，补成可支撑 PPT 的短报告式内容基底
  材料完整：抽取并结构化，不强行扩写
  必须标注：user_provided / inferred / needs_confirmation

阶段 2: 视觉策略与大纲确认 [HARD STOP]
  如需视觉方向，调用 ppt-visual 定义风格 token、预览标准和反演规则
  如用户要求 image-first / 预览优先，先生成 16:9 首页、目录页、正文页预览再锁定风格
  每页标注：页面类型 + page_rhythm + 核心信息 + 信息块数
  输出：design_spec.md + spec_lock.md + outline.md

阶段 3: 生成分支确认 [HARD STOP]
  默认：可编辑优先，走 SVG → DrawingML PPTX
  明确 image-first：走整页图像生成，可选每页 1 张或每页多候选再挑
  如果可编辑性与视觉保真冲突，先说明取舍，再继续

阶段 4: 生成与转换
  SVG 分支：逐页生成，每页前重读 spec_lock；校验后转换为原生 DrawingML PPTX
  image-first 分支：逐页生成完整 16:9 页面图；默认零后期覆盖；交给 pptx 封装为 PPTX

阶段 5: 初稿评审 [HARD STOP]
  不把第一版当最终完成；按页评审视觉、内容、可读性和生成缺陷

阶段 6: 返修与交付
  SVG 分支：按页码修改 SVG → 重新校验 → 重新转换
  image-first 分支：先分类为整页重生 / 局部图像编辑 / 内容蓝图变更，再返修页面图
```

## page_rhythm 节奏

| 标签 | 信息密度 | 典型页面 |
|------|----------|----------|
| anchor | 1-2 块 | cover, section, ending |
| dense | 3-5 块 | content, data, comparison, timeline |
| breathing | 1-2 块 | agenda, quote, team |

编排规则：dense 不连续超过 3 页；首尾必须 anchor；每 4-6 页至少一次 breathing。

## 代码模式

SVG 质量校验与 PPTX 封装参考 [references/pptx.md](references/pptx.md) 中的 `python-pptx` 流程，按页生成后逐页校验内联属性合规性（禁用 `<mask>`/`<style>`/`<foreignObject>`/`<filter>`/CSS class）。

## 检查清单

- [ ] baseline judgment 已完成并通过需求确认
- [ ] 薄材料已生成 content_basis.md，且标注 claim status
- [ ] spec_lock 已锁定
- [ ] image-first 请求已先给真实 16:9 预览并完成风格确认
- [ ] 已确认走可编辑 SVG 分支还是 image-first 页面图分支
- [ ] 大纲标注了 page_rhythm 且不超过 3 页连续 dense
- [ ] SVG 分支每页生成前重读 spec_lock，且通过 quality checker
- [ ] image-first 分支没有添加未批准的后期覆盖层
- [ ] PPTX 可正常打开
- [ ] 页数与 spec_lock 一致

## 反模式

详细反模式与正确做法见 [references/anti-patterns.md](references/anti-patterns.md)。
页面类型参考见 [references/page-types.md](references/page-types.md)。
