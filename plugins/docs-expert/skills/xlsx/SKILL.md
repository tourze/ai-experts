---
name: xlsx
description: 当用户要处理 .xlsx、.xlsm、.csv、.tsv 等表格文件时使用。
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
- 是否在交付前运行过 `scripts/recalc.py` 或等价重算流程。
- 是否抽查了典型公式、错误单元格和格式保留情况。
- 若只是提取数据供写作或分析，可交给 [markitdown](../markitdown/SKILL.md) 或 [consulting-analysis](../consulting-analysis/SKILL.md)。

## 反模式

### FAIL: 只改显示不重算

```python
ws['D5'] = 1500  # 改了显示值
wb.save('out.xlsx')
# 但 D5 的依赖单元格 E5/F5 仍是旧公式结果
# 用户打开后："总和怎么不对？"
```

### PASS: 重算后保存

```python
import subprocess

ws['D5'] = 1500
wb.save('out.xlsx')
subprocess.run(['python3', 'scripts/recalc.py', 'out.xlsx', '60'], check=True)
# 或在 Excel 中打开后自动 F9
```

### FAIL: 覆盖模板

```python
wb = openpyxl.Workbook()  # 全新空工作簿
wb.save('template.xlsx')
# 原模板的：
# - 条件格式 / 数据验证
# - 隐藏 sheet
# - 命名范围
# 全部丢失
```

### PASS: 在副本上改

```python
shutil.copy('template.xlsx', 'output.xlsx')
wb = openpyxl.load_workbook('output.xlsx')
# 在副本上改 → 保留所有原有结构
```

### FAIL: 不检查错误单元格

```python
wb.save('result.xlsx')
# 客户打开发现 #VALUE! / #REF! / #DIV/0!
# 信任崩
```

### PASS: 校验

```python
errors = []
for sheet in wb.sheetnames:
    for row in wb[sheet].iter_rows():
        for cell in row:
            if isinstance(cell.value, str) and cell.value.startswith('#'):
                errors.append(f"{sheet}!{cell.coordinate}={cell.value}")
if errors:
    print(f"⚠️ {len(errors)} 个错误单元格：{errors[:5]}")
    # 修复或显式标注后再交付
```
