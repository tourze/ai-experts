## 代码模式

如果用户给了历史文案目录，可按以下模式整理样本：

```bash
find 已发布 -name '*.md' | sort | head
```

推荐输出模板：

```markdown
# 标题
<20 字内钩子标题>

## 口播文案
<3-6 段，单段不超过 40 字>

## 推荐标签
#标签1 #标签2 #标签3 #标签4

## 复盘说明
- 核心钩子：
- 情绪方向：
- 互动动作：
- 适配人群：
```

评分和优化时，只引用现有参考资料：

- [爆款要素](references/viral-factors.md)
- [评分规则](references/scoring-system.md)
- [预估模型](references/estimation-model.md)
- [优化策略](references/optimization-guide.md)
- [历史学习方法](references/learning-guide.md)
