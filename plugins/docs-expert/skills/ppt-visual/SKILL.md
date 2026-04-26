---
name: ppt-visual
description: 当用户要设计演示文稿的版式、视觉方向、信息层级、配色或单页结构时使用。该技能输出设计说明和页面规范，不直接替代 PPTX 文件加工链路。
---

# PPT 视觉设计

## 适用场景

- 用户已经有内容，希望把它整理成有说服力的演示结构和视觉规格。
- 需要明确首页、章节页、数据页、对比页、案例页等版式套路。
- 目标是先产出设计方案，再交给 [pptx](../pptx/SKILL.md) 做文件级编辑或生成。
- 作为 [ppt-generate](../ppt-generate/SKILL.md) 的视觉阶段，定义真实预览标准、风格向量和风格反演规则。
- 适合商业提案、汇报材料、培训课件、路演和项目复盘。

## 核心约束

- 先明确观众、场景和讲述顺序，再谈颜色和插图。
- 一页只传达一个主信息点，避免“所有要点都重要”。
- 视觉方案必须服务于内容权重，不能把弱信息做成强视觉。
- 不凭空承诺图片、图标或数据资产已经存在；缺失就写清楚需求。
- preview-first 请求必须用首页 / 目录页 / 正文页三类 16:9 内容型页面验证风格；文字描述不能替代真实预览。
- 风格确认后先做反演确认：把已选预览拆成 deck-wide 约束、需确认元素和局部偶然效果，再写入 spec_lock。

## 代码模式

```json
{
  "场景": "客户提案终审汇报",
  "页面类型": ["封面", "问题定义", "方案对比", "实施计划", "报价"],
  "视觉方向": "克制、专业、偏咨询风格",
  "约束": ["少动画", "16:9", "适配投影"]
}
```

如需落成可编辑文件，再转到 [pptx](../pptx/SKILL.md)。

## preview-first 规则

当用户要求先看风格效果、图像级预览或 image-first 成稿时，不要只给风格名称和配色表。先定义内部风格向量，再用可比较的方向卡表达：

| 向量 | 用途 |
|------|------|
| V1 layout system | 页面结构、网格、主次区域 |
| V2 texture/material | 材质、纹理、平面或拟物程度 |
| V3 lighting/depth | 光照、层次、阴影、空间感 |
| V4 palette roles | 主色、结构色、强调色和背景色角色 |
| V5 container/motif | 首页视觉隐喻、正文信息容器语法 |
| V6 density/rhythm | 信息密度与页面呼吸节奏 |
| V7 text-visual balance | 文字、图像、图表的比例 |
| V8 brand constraint | 品牌、学校、公司或课题组锚点强度 |

每个方向的预览固定为：

- 首页：检查第一印象、主视觉和身份锚点。
- 目录页：检查结构承载和章节层级。
- 正文页：检查信息密度、可读性和容器语法。

预览必须继承用户材料或 `content_basis.md`，不能使用 placeholder、空白面板、无信息装饰页或另起一套通用大纲。

## 风格反演确认

用户选定预览方向后，先把真实预览当证据，不只相信原始提示词。输出三类判断：

- 明确应延续的：多张预览稳定出现，且适合写入 deck-wide continuity anchor。
- 效果好但需确认的：可能是用户喜欢的主题元素，但是否整套延续需要确认。
- 局部偶然效果：只适合当前页，不写入全局锁定。

`spec_lock` 只锁定第一类和用户明确确认的第二类。不要把一次性的构图、装饰或生成偶然效果升级成整套 deck 的硬约束。

## 风格预设库

内置 8 种风格预设，每种包含完整的可执行设计 token（色彩、排版、布局、page_rhythm）：

| 预设 | 适用场景 |
|------|---------|
| [corporate-blue](references/styles/corporate-blue.md) | 大企业汇报、董事会、投资人 |
| [minimal-gray](references/styles/minimal-gray.md) | 技术分享、产品发布 |
| [consulting](references/styles/consulting.md) | 麦肯锡/BCG 风格提案 |
| [dark-tech](references/styles/dark-tech.md) | 技术会议、AI/数据主题 |
| [warm-creative](references/styles/warm-creative.md) | 品牌、营销、设计提案 |
| [academic](references/styles/academic.md) | 论文答辩、学术会议 |
| [startup-pitch](references/styles/startup-pitch.md) | VC pitch、demo day |
| [gov-formal](references/styles/gov-formal.md) | 政府汇报、公文风格 |

选定预设后，其 token 值直接写入 spec_lock，作为 AI 生成 SVG 的执行约束。

## 检查清单

- 是否明确了听众、时长、汇报动作和展示设备。
- 是否从预设库选择或自定义了风格预设。
- 是否给出了每页的主标题、副标题、重点数字与配图建议。
- 是否定义了色板、字号层级、图表风格和留白规则。
- preview-first 场景是否定义了首页 / 目录页 / 正文页三页预览标准。
- 风格确认后是否完成反演确认，并区分全局约束与局部效果。
- 是否区分了”视觉建议”和”实际素材清单”。
- 最终如需生成 PPTX，是否已准备交给 [ppt-generate](../ppt-generate/SKILL.md) 或 [pptx](../pptx/SKILL.md)。

## 反模式

### FAIL: 一页堆满

```
首页：标题 + 副标题 + 4 段说明 + 6 个 logo + 数据图 + CTA
字号 10pt，投影上看不清
→ 听众读 30 秒还在找重点
```

### PASS: 一页一信息

```
首页：
- 一句话主张（48pt）
- 一个支撑数据（36pt）
- 演讲者口头补充其他
信息架构 → 每页只承载一个观点
```

### FAIL: 客户场景娱乐化

```
ToB 银行客户提案 → 卡通图 + emoji + bounce 动画
→ 客户："不够严肃，团队会议都过不了"
```

### PASS: 风格匹配场景

```
银行 / 政府：克制 / 正式 / 数据驱动
- 字体：宋体 / Inter
- 配色：深蓝 + 灰
- 图表：极简 + 数据清晰
- 动画：仅 fade in，无 bounce / spin
```
