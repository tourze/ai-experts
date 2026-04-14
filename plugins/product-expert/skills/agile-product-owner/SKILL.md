---
name: agile-product-owner
description: 当用户需要编写用户故事、补齐验收标准、拆分 Epic、规划 Sprint 或排序 Backlog 时使用；覆盖 INVEST、Given-When-Then、容量规划与节奏管理。
---

# 敏捷产品负责人

## 适用场景
- 把需求拆成可交付的用户故事、Epic 和 Sprint 范围。
- 需要结合 [references/user-story-templates.md](references/user-story-templates.md)、[references/sprint-planning-guide.md](references/sprint-planning-guide.md) 或模板资产落文档。
- 需要运行脚本生成示例 Backlog 或 Sprint 计划时，可直接调用 `scripts/user_story_generator.py`。

## 核心约束
- 先确认业务目标、角色、成功标准，再拆故事；单条 Story 应能在一个 Sprint 内完成。
- 验收标准必须覆盖成功路径、失败路径和边界条件，避免“优化一下”这类不可验证表述。
- 运行脚本时只使用已验证命令：`python3 scripts/user_story_generator.py` 与 `python3 scripts/user_story_generator.py sprint 30`；Sprint 容量必须是正整数。

## 代码模式
```bash
python3 scripts/user_story_generator.py
python3 scripts/user_story_generator.py sprint 30
```

```markdown
用户故事：作为<角色>，我想要<动作>，以便<收益>
验收标准：Given <前置条件> When <动作> Then <结果>
```

## 检查清单
- [ ] 用户角色、业务目标、非目标和依赖已经明确。
- [ ] Story 满足 INVEST，验收标准可直接转为测试用例。
- [ ] Sprint 承诺范围与容量匹配，Stretch 目标没有挤占 committed 范围。
- [ ] 模板、参考资料与脚本参数保持一致。

## 反模式
- 直接把 Epic 当成 Story 进入 Sprint。
- 把“提升体验”“支持更多场景”写成没有边界的需求。
- 在容量、优先级或依赖未确认时承诺交付日期。
