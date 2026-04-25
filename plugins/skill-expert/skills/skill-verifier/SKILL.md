---
name: skill-verifier
description: 当用户要用源材料出题并通过闭卷答题验证 SKILL.md 是否遗漏关键事实、能否独立支撑任务执行时使用。
---

# Skill Verifier

通过闭卷考试验证 skill 的知识完备性。与 skill-judge（评分维度审查）互补：judge 看结构和设计质量，verifier 看实际知识覆盖。

## 路由

- 评估 skill 的设计质量/评分 → [skill-judge](../skill-judge/SKILL.md)
- 验证 skill 的知识覆盖完备性 → 本 skill
- 创建新 skill → [skill-creator](../skill-creator/SKILL.md)

## 用法

```
/skill-verifier <skill-path> <source-path>
```

- **skill-path**: 要验证的 skill 目录（含 SKILL.md）
- **source-path**: skill 所描述的知识来源（代码目录、文档目录等）

## 验证流程

### Step 1 — Examiner 出题

派遣子代理（**用 haiku 模型**）读取 `<source-path>`，生成 5-8 道验证题：

**MANDATORY — 读取 examiner prompt**: `references/examiner-prompt.md`

Examiner 规则：
- 只读源材料，不读 skill 文件
- 每题附带 answer_key + 2-5 个 required_facts
- 覆盖三类：细节题、逻辑题、集成题

### Step 2 — Examinee 闭卷答题

派遣子代理只读 `<skill-path>`，回答所有验证题：

**MANDATORY — 读取 examinee prompt**: `references/examinee-prompt.md`

Examinee 规则：
- 只读 skill 文件，不读源材料
- 答不出回答 "CANNOT_ANSWER"

### Step 3 — 评判

逐题对比答案与 required_facts：全覆盖 = PASS，任一缺失 = FAIL。

### Step 4 — 循环

- 100% 通过 → 验证完成，输出报告
- 任何失败 → 向用户展示缺口，建议补充方向
- 用户补充 skill 后可重新验证（最多 3 轮）

## 输出

```markdown
# Skill 验证报告 — {skill-name}

- 通过率：X/Y (Z%)
- 轮次：N/3

## 通过的题目
[列表]

## 失败的题目
| 题目 | 期望事实 | 实际答案 | 缺口 |
|------|---------|---------|------|

## 建议补充方向
[基于缺口分析的具体建议]
```
