## 代码模式

### 元数据优化

```bash
python3 - <<'PY'
import sys
sys.path.insert(0, "src/components/skills/app-store-optimization")
from metadata_optimizer import optimize_app_metadata

report = optimize_app_metadata(
    "apple",
    {
        "name": "FocusFlow",
        "category": "Productivity",
        "target_audience": "忙碌的知识工作者",
        "key_features": ["专注计时", "待办清单", "跨设备同步"],
        "unique_value": "把任务优先级和专注时段合并在一个流程里"
    },
    ["focus timer", "todo", "productivity"]
)
print(report["title"]["recommendation"])
PY
```

### 计算 ASO 健康分

```bash
python3 - <<'PY'
import sys
sys.path.insert(0, "src/components/skills/app-store-optimization")
from aso_scorer import calculate_aso_score

score = calculate_aso_score(
    {"title_quality": 0.8, "description_quality": 0.7, "keyword_density": 0.6},
    {"average_rating": 4.5, "total_ratings": 15000},
    {"top_10": 5, "top_50": 12, "top_100": 18},
    {"impression_to_install": 0.05},
)
print(score["overall_score"])
PY
```

### 评论、竞品与本地化分析

```bash
python3 - <<'PY'
import sys
sys.path.insert(0, "src/components/skills/app-store-optimization")
from review_analyzer import analyze_reviews
from competitor_analyzer import analyze_competitor_set
from localization_helper import plan_localization_strategy

reviews = analyze_reviews("FocusFlow", [{"id": "1", "text": "Great app but crashes on sync", "rating": 2}])
competitors = analyze_competitor_set("Productivity", [{"title": "Todoist", "description": "Task manager", "rating": 4.8, "ratings_count": 100000}], "apple")
locales = plan_localization_strategy("en-US", "medium", 50000)
print(reviews["issues_identified"]["top_issues"])
print(competitors["competitive_position"])
print(locales["recommended_markets"][:2])
PY
```

### 生成更新文案

```bash
node scripts/collect_release_changes.mjs [from..to]
```

按"新增 / 优化 / 修复"归类，过滤掉 refactor/chore/CI 提交；详见 `references/changelog-guide.md`。
