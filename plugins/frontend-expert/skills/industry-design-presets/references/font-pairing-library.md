# 字体配对库

与 `industry-design-presets` 联动的字体组合参考。

## 使用方式

- 从行业预设选择，不由 `industry-design-presets` 直接推导。
- 每次实现时只从本库导入已配对好的组合。

## 组合模板

| 用途 | 标题 | 正文 | 风格 |
|------|------|------|------|
| SaaS 产品 | Inter | Inter | 干净、现代、高可读 |
| 内容/出版 | Playfair Display | Source Serif 4 | 经典、权威、可读 |
| 金融/数据 | IBM Plex Sans | IBM Plex Sans | 专业、可信、数字友好 |
| 创意/设计 | Space Grotesk | DM Sans | 个性、几何、现代 |
| 开发者工具 | JetBrains Mono | Inter | 技术感、代码友好 |

## 约束

- 每组配对优先使用 Google Fonts 或系统字体栈。
- 回退字体栈至少包含 2 级备选。
- 标题和正文字体不超过 2 个 family。
