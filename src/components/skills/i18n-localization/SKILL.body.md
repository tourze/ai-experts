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

## 参考资料

- [scripts/i18n_checker.mjs](scripts/i18n_checker.mjs)
