# App Store ASO 优化

## 适用场景

- 需要评估关键词、标题、副标题、描述和关键词字段。
- 需要分析竞品、评论趋势、评分结构和增长优先级。
- 需要设计素材或元数据 A/B 测试方案。
- 需要规划多语言本地化、发版节奏和上线检查清单。
- 需要从最近一个 tag 到当前版本提炼 App Store「新内容」文案。
- 需要把技术提交整理成用户能看懂的发布摘要。

## 核心约束

- 这些 `*.py` 主要是库模块；优先通过 `python3 - <<'PY'` 导入调用，不要假设每个文件都提供稳定 CLI。
- 搜索量、竞争度、转化率等输入必须来自用户或可信数据源；不要伪造市场数据。
- Apple 与 Google 的字段限制不同，所有输出都必须带字符数校验。
- 本地化不是逐词翻译，必须同时考虑市场、文化语义和搜索行为。
- 更新文案规则：先确认真实改动范围再写，只保留用户可感知改动，每条必须可追溯到真实提交；详见 `references/changelog-guide.md`。

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

## 检查清单

- 元数据优化优先用 `metadata_optimizer.py`，并校验 Apple / Google 字符上限。
- 关键词分析优先用 `keyword_analyzer.py`，竞品对标优先用 `competitor_analyzer.py`。
- 评论洞察用 `review_analyzer.py`，不要把低星评论直接等同于真实需求。
- 发版准备使用 `launch_checklist.py`，测试规划使用 `ab_test_planner.py`。
- 交叉引用：需要审核合规视角时切到 `apple-appstore-reviewer`。

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
