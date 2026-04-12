# PHPUnit 最佳实践

为代理和 LLM 优化的 PHPUnit 最佳实践创建和维护的结构化仓库。

## 结构

- `rules/` - 单独的规则文件（每条规则一个文件）
  - `_sections.md` - 章节元数据（标题、影响程度、描述）
  - `_template.md` - 创建新规则的模板
  - `area-description.md` - 单独的规则文件
- `metadata.json` - 文档元数据（版本、组织、摘要）
- __`AGENTS.md`__ - 编译后的输出（自动生成）

## 创建新规则

1. 将 `rules/_template.md` 复制为 `rules/area-description.md`
2. 选择合适的区域前缀：
   - `principle-` 用于原则与模式（第 1 节）
   - `standard-` 用于编码标准（第 2 节）
   - `attr-` 用于测试属性（第 3 节）
   - `data-` 用于数据管理（第 4 节）
   - `doc-` 用于测试文档（第 5 节）
   - `mock-` 用于 Mock（第 6 节）
   - `integration-` 用于集成测试（第 7 节）
   - `config-` 用于配置（第 8 节）
3. 填写 frontmatter 和内容
4. 确保有清晰的示例和说明
5. 重新构建 AGENTS.md 以包含新规则

## 规则文件结构

每个规则文件应遵循以下结构：

```markdown
---
title: 规则标题
impact: MEDIUM
impactDescription: 可选的描述
tags: tag1, tag2, tag3
---

## 规则标题

规则的简要说明及其重要性。

**错误（描述问题所在）：**

```php
// 错误代码示例
```

**正确（描述正确做法）：**

```php
// 正确代码示例
```

示例后的可选说明文字。

参考：[链接](https://example.com)
```

## 文件命名约定

- 以 `_` 开头的文件是特殊文件（从构建中排除）
- 规则文件：`area-description.md`（例如 `principle-aaa-pattern.md`）
- 章节从文件名前缀自动推断
- 规则在每个章节内按标题字母顺序排序

## 影响级别

- `CRITICAL` - 最高优先级，基础实践
- `HIGH` - 显著的质量提升
- `MEDIUM-HIGH` - 中高收益
- `MEDIUM` - 中等改进
- `LOW-MEDIUM` - 中低收益
- `LOW` - 增量改进

## 贡献

添加或修改规则时：

1. 使用正确的文件名前缀对应章节
2. 遵循 `_template.md` 结构
3. 包含清晰的错误/正确 PHP 示例和说明
4. 添加合适的标签
5. 重新构建 AGENTS.md 以包含你的更改

## 致谢

结构灵感来自 [Vercel 的 React Best Practices](https://github.com/vercel-labs/agent-skills) skill，作者 [@shuding](https://x.com/shuding)。

内容基于 [PHPUnit Best Practices](https://gnugat.github.io/2025/07/31/phpunit-best-practices.html)，作者 Loic Faugeron，以及通用 PHPUnit 专业知识。
