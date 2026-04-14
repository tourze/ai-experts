# PHPUnit 最佳实践规则库

`phpunit-best-practices` skill 使用本目录中的规则文件作为细粒度参考资料。这里不是“自动生成物目录”，而是人工维护的规则源。

## 当前结构

- `SKILL.md`：面向代理的入口说明，定义触发场景、约束、代码模式和交叉引用。
- `rules/`：分主题拆开的规则文件，每个文件只描述一条实践。
- `rules/_sections.md`：章节元数据。
- `rules/_template.md`：新增规则时的模板。
- `metadata.json`：规则库版本、摘要和参考链接。

## 新增或修改规则

1. 复制 `rules/_template.md` 为新文件。
2. 使用正确的区域前缀：
   - `principle-`：原则与模式
   - `standard-`：编码标准
   - `attr-`：测试属性
   - `data-`：数据提供者与数据构造
   - `doc-`：测试文档与命名
   - `mock-`：Mock 策略
   - `integration-`：集成测试
   - `config-`：phpunit.xml 与工具配置
3. 填写 frontmatter、错误示例、正确示例和简短说明。
4. 在 `SKILL.md` 的“检查清单”里补充必要的交叉引用。

## 规则文件格式

每个规则文件遵循同一模板：

````markdown
---
title: 规则标题
impact: MEDIUM
impactDescription: 可选说明
tags: tag1, tag2, tag3
---

## 规则标题

规则的简要说明及其重要性。

**错误（问题示例）：**

```php
// 错误代码
```

**正确（推荐写法）：**

```php
// 正确代码
```

补充说明。
````

## 命名约定

- 以 `_` 开头的文件保留给模板或元数据。
- 规则文件命名格式为 `area-description.md`，例如 `principle-aaa-pattern.md`。
- 章节由文件名前缀推导；同章节内按标题字母序展示。

## 影响级别

- `CRITICAL`：基础实践，默认优先执行
- `HIGH`：收益显著
- `MEDIUM-HIGH`：中高收益
- `MEDIUM`：中等收益
- `LOW-MEDIUM`：次优先
- `LOW`：增量优化

## 致谢

结构灵感来自 [Vercel 的 React Best Practices](https://github.com/vercel-labs/agent-skills)。
内容整理参考 [PHPUnit Best Practices](https://gnugat.github.io/2025/07/31/phpunit-best-practices.html) 与 PHPUnit 官方文档。
