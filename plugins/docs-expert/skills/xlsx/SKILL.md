---
name: xlsx
description: 当任务以 .xlsx、.xlsm、.csv、.tsv 等表格文件为主输入或输出时使用，包括修表、建模、重算公式、清洗结构和回写为 Excel 成品。
---

# XLSX

## 适用场景

- 用户明确提到 Excel、`.xlsx`、报表模型、预算表、财务表、数据清洗或公式修复。
- 需要保留表格文件作为最终交付，而不是只导出文本。
- 需要解包检查结构、重算公式、验证错误值，或修复模板文件。
- 如果目标只是把表格内容转成 Markdown，可结合 [markitdown](../markitdown/SKILL.md)。

## 核心约束

- 先确认最终交付是电子表格，而不是文档或数据库脚本。
- 公式类改动必须检查重算结果，不能只改单元格文本。
- 对模板类文件要尽量保留格式、命名区域和既有工作表结构。
- 大幅修改前先备份原件，并记录关键工作表与公式区域。

## 代码模式

```bash
python3 scripts/office/unpack.py model.xlsx unpacked
python3 scripts/recalc.py model.xlsx 60
python3 scripts/office/validate.py unpacked
python3 scripts/office/pack.py unpacked model-fixed.xlsx --validate true
```

## 检查清单

- 是否确认了输出仍需是 `.xlsx/.xlsm/.csv/.tsv`。
- 是否识别出关键工作表、公式区、命名范围和依赖关系。
- 是否在交付前运行过 `recalc.py` 或等价重算流程。
- 是否抽查了典型公式、错误单元格和格式保留情况。
- 若只是提取数据供写作或分析，可交给 [markitdown](../markitdown/SKILL.md) 或 [consulting-analysis](../consulting-analysis/SKILL.md)。

## 反模式

- 只改显示值，不重算公式就宣称修好了。
- 直接覆盖模板，导致格式、条件格式或隐藏工作表丢失。
- 交付前不检查 `#VALUE!`、`#REF!` 等错误。
- 用户要的是表格文件，结果只回了文本摘要。
