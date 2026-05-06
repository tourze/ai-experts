## 代码模式

### 元数据优化

```bash
npx tsx --eval '
import { optimize_app_metadata } from "./src/components/skills/app-store-optimization/metadata_optimizer.ts";

const report = optimize_app_metadata(
  "apple",
  {
    name: "FocusFlow",
    category: "Productivity",
    target_audience: "忙碌的知识工作者",
    key_features: ["专注计时", "待办清单", "跨设备同步"],
    unique_value: "把任务优先级和专注时段合并在一个流程里",
  },
  ["focus timer", "todo", "productivity"],
);

console.log(report.title.recommendation);
'
```

### 计算 ASO 健康分

```bash
npx tsx --eval '
import { calculate_aso_score } from "./src/components/skills/app-store-optimization/aso_scorer.ts";

const score = calculate_aso_score(
  { title_quality: 0.8, description_quality: 0.7, keyword_density: 0.6 },
  { average_rating: 4.5, total_ratings: 15000 },
  { top_10: 5, top_50: 12, top_100: 18 },
  { impression_to_install: 0.05 },
);

console.log(score.overall_score);
'
```

### 评论、竞品与本地化分析

```bash
npx tsx --eval '
import { analyze_reviews } from "./src/components/skills/app-store-optimization/review_analyzer.ts";
import { analyze_competitor_set } from "./src/components/skills/app-store-optimization/competitor_analyzer.ts";
import { plan_localization_strategy } from "./src/components/skills/app-store-optimization/localization_helper.ts";

const reviews = analyze_reviews("FocusFlow", [{ id: "1", text: "Great app but crashes on sync", rating: 2 }]);
const competitors = analyze_competitor_set("Productivity", [{ title: "Todoist", description: "Task manager", rating: 4.8, ratings_count: 100000 }], "apple");
const locales = plan_localization_strategy("en-US", "medium", 50000);

console.log(reviews.issues_identified.top_issues);
console.log(competitors.ranked_competitors[0]?.app_name ?? "n/a");
console.log(locales.target_markets.recommended_markets.slice(0, 2));
'
```

### 生成更新文案

```bash
node scripts/collect_release_changes.mjs [from..to]
```

按"新增 / 优化 / 修复"归类，过滤掉 refactor/chore/CI 提交；详见 `references/changelog-guide.md`。
