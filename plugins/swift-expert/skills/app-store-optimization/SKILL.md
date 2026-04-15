---
name: app-store-optimization
description: 当用户要做 App Store 或 Google Play 的 ASO 优化时使用。
risk: unknown
source: community
date_added: "2026-02-27"
---

# App Store ASO 优化

## 适用场景

- 需要评估关键词、标题、副标题、描述和关键词字段。
- 需要分析竞品、评论趋势、评分结构和增长优先级。
- 需要设计素材或元数据 A/B 测试方案。
- 需要规划多语言本地化、发版节奏和上线检查清单。

## 核心约束

- 这些 `*.py` 主要是库模块；优先通过 `python3 - <<'PY'` 导入调用，不要假设每个文件都提供稳定 CLI。
- 搜索量、竞争度、转化率等输入必须来自用户或可信数据源；不要伪造市场数据。
- Apple 与 Google 的字段限制不同，所有输出都必须带字符数校验。
- 本地化不是逐词翻译，必须同时考虑市场、文化语义和搜索行为。

## 代码模式

### 元数据优化

```bash
python3 - <<'PY'
import sys
sys.path.insert(0, "plugins/swift-expert/skills/app-store-optimization")
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
sys.path.insert(0, "plugins/swift-expert/skills/app-store-optimization")
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
sys.path.insert(0, "plugins/swift-expert/skills/app-store-optimization")
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

## 检查清单

- 元数据优化优先用 `metadata_optimizer.py`，并校验 Apple / Google 字符上限。
- 关键词分析优先用 `keyword_analyzer.py`，竞品对标优先用 `competitor_analyzer.py`。
- 评论洞察用 `review_analyzer.py`，不要把低星评论直接等同于真实需求。
- 发版准备使用 `launch_checklist.py`，测试规划使用 `ab_test_planner.py`。
- 交叉引用：需要实际门店更新文案时切到 `app-store-changelog`；需要审核合规视角时切到 `apple-appstore-reviewer`。

## 反模式

- 把“高搜索量 / 低竞争”当成无需证据的拍脑袋结论。
- 忽略门店字符限制，只给长文案不做裁剪。
- 用直译代替本地化，导致关键词完全不符合本地搜索习惯。
- 把所有优化建议都堆成一次性改动，完全没有实验与归因。
