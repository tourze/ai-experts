---
name: i18n-localization
description: 当需要实现多语言、排查硬编码文案、管理翻译资源、设计 locale 结构或处理 RTL 与日期数字格式时使用。
risk: safe
source: community
date_added: "2026-02-27"
---

# 国际化与本地化

## 适用场景

- 应用需要支持多语言、多地区或右到左布局。
- 需要从硬编码文案迁移到翻译键。
- 需要梳理 locale 目录、命名空间和翻译补全流程。
- 需要检查日期、货币、数字和复数规则是否按地区展示。

## 核心约束

- 文案必须用键，不要把自然语言直接写进组件逻辑。
- 句子级翻译优先于字符串拼接；拼接会破坏语序、复数和性别变化。
- locale 文件按功能域拆分，不要把全部文案塞进一个大 JSON。
- RTL 不是“文字反过来”这么简单，布局、图标方向、滚动与动画都要核查。
- 国际化上线前必须验证回退语言和缺失翻译策略。
- 需要静态检查时直接运行 `scripts/i18n_checker.py`。

## 代码模式

```tsx
import { useTranslation } from "react-i18next";

export function WelcomeCard() {
  const { t } = useTranslation("home");
  return <h1>{t("hero.title")}</h1>;
}
```

```json
{
  "cart": {
    "itemCount": "{count, plural, =0 {购物车为空} one {# 件商品} other {# 件商品}}"
  }
}
```

```bash
python3 ./scripts/i18n_checker.py /path/to/project
```

## 检查清单

- [ ] 所有用户可见文案都已脱离组件硬编码。
- [ ] locale 目录按语言和命名空间组织清晰。
- [ ] 缺失翻译时有明确回退语言。
- [ ] 日期、时间、数字、货币都使用地区化 API。
- [ ] RTL 页面已验证布局、图标方向和文本对齐。
- [ ] 提交前已跑 `scripts/i18n_checker.py` 或等价 lint。

## 反模式

- 在 JSX 或模板里直接写整句自然语言。
- 通过字符串拼接构造句子。
- 把业务键命名成当前语言文案本身。
- 忽略阿拉伯语、希伯来语等 RTL 情况。
- 只翻译默认页面，不翻错误态、空态、邮件和通知。

## 参考资料

- [web-design-guidelines](../web-design-guidelines/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [scripts/i18n_checker.py](scripts/i18n_checker.py)
