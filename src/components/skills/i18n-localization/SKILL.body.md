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
node ./scripts/i18n_checker.mjs /path/to/project
```

## 检查清单

- [ ] 所有用户可见文案都已脱离组件硬编码。
- [ ] locale 目录按语言和命名空间组织清晰。
- [ ] 缺失翻译时有明确回退语言。
- [ ] 日期、时间、数字、货币都使用地区化 API。
- [ ] RTL 页面已验证布局、图标方向和文本对齐。
- [ ] 提交前已跑 `scripts/i18n_checker.mjs` 或等价 lint。

## 反模式

### FAIL: 字符串拼接造句

```tsx
<p>{t("cart.youHave")} {count} {t("cart.items")}</p>
// 英文勉强可用，阿拉伯语语序反、俄语词形变化 → 全错
```

### PASS: 句子级 + ICU plural

```tsx
<p>{t("cart.itemCount", { count })}</p>

// zh-CN: "itemCount": "{count, plural, =0 {购物车为空} other {# 件商品}}"
// ar:    "itemCount": "{count, plural, =0 {السلة فارغة} one {# عنصر} other {# عناصر}}"
```

### FAIL: 业务键是语言文案

```json
{ "click_here_to_submit": "点击这里提交" }
// 改文案 = 改键，跨语言查找困难
```

### PASS: 语义键

```json
{ "form.submit": "点击这里提交" }
```

### FAIL: 只翻默认页面

```
登录页：已翻译
404/支付失败邮件：仍是英文
→ 用户在非母语错误信息中迷路
```

### PASS: 全覆盖翻译矩阵

```
页面 + 错误态 + 空态 + toast + 邮件模板 + 推送通知
```

## 参考资料

- [scripts/i18n_checker.mjs](scripts/i18n_checker.mjs)
