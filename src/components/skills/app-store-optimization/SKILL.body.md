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

## 反模式

### FAIL: 无证据的”高搜索低竞争”

```
“用 productivity 作为核心关键词，搜索量高竞争低”
→ 无数据支撑，productivity 在 Apple 是顶级红海
```

### PASS: 基于真实数据

```
- productivity：量 90，竞争 85 → 红海
- pomodoro timer：量 58，竞争 52 → 主攻
- focus timer productivity：量 42，竞争 35 → 长尾
建议：主标题 pomodoro，副标题 focus timer
```

### FAIL: 直译代替本地化

```
日文标题（机器翻译）：FocusFlow - 集中を保つ
→ 日本用户搜 “集中力” / “ポモドーロ”，不搜这个组合
```

### PASS: 按本地搜索习惯

```
日文：FocusFlow - ポモドーロ集中タイマー
关键词：ポモドーロ,集中力,タスク管理,作業効率
→ 匹配本地搜索词
```

### FAIL: 一次改所有东西

```
同时改标题+描述+关键词+截图+价格
→ 下载涨了，不知道哪个起作用
```

### PASS: 单变量 + 归因

```
W1 只改标题 → 看 impression-to-install
W2 只改截图 → 看 install rate
W3 只改关键词 → 看 search visibility
```
