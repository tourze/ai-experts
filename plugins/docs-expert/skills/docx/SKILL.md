---
name: docx
description: 当用户要创建、读取、编辑或修复 .docx Word 文档时使用。
---

# DOCX

## 适用场景

- 用户明确提到 Word、`.docx`、报告模板、合同、函件、备忘录等交付物。
- 需要处理批注、修订、作者信息、段落结构或 XML 级问题。
- 需要把文档解包后精修，再打包回 `.docx`。
- 若目标只是把 Word 内容转成 Markdown，可优先参考 [markitdown](../markitdown/SKILL.md)。

## 核心约束

- 先确认最终交付是否必须是 `.docx`；如果不是，不要误用该技能。
- 有修订或批注时，优先走“解包 → 修改 → 校验 → 打包”流程，避免直接硬改压缩包。
- 修改后必须校验结构完整性；涉及修订时要保留作者口径一致。
- 对安全或兼容性敏感的编辑，使用 `scripts/office/` 工具链，而不是手搓 XML。

## 代码模式

```bash
python3 scripts/office/unpack.py report.docx unpacked --merge-runs true --simplify-redlines true
python3 scripts/comment.py unpacked 7 "请补充证据来源" --author "Claude" --initials "CC"
python3 scripts/office/validate.py unpacked --author "Claude"
python3 scripts/office/pack.py unpacked report-reviewed.docx --validate true
```

如需接受全部修订，可直接使用 [scripts/accept_changes.py](scripts/accept_changes.py)：

```bash
python3 scripts/accept_changes.py tracked.docx clean.docx
```

## 检查清单

- 是否确认输出必须是 `.docx` 而不是 PDF 或 Markdown。
- 是否在编辑前备份原件，尤其是存在修订、批注、页眉页脚和域代码时。
- 是否使用 [scripts/comment.py](scripts/comment.py) 或 `scripts/office/` 工具链，而不是手动拼接 XML。
- 是否在回包前运行 `scripts/office/validate.py`，并根据需要提供 `--original` 做差异校验。
- 若需要后续导出 PDF，可转给 [pdf](../pdf/SKILL.md) 或 [md-to-pdf](../md-to-pdf/SKILL.md)。

## 反模式

### FAIL: 直接改 zip 内 XML

```bash
unzip -o report.docx
sed -i 's/old/new/g' word/document.xml
zip -r report.docx .
# document.xml.rels 引用未更新 → Word 打开报损坏
```

### PASS: 解包 → 改 → 校验 → 打包

```bash
python3 scripts/office/unpack.py report.docx unpacked
# 用脚本工具改，自动维护关系
python3 scripts/comment.py unpacked 7 "请补充" --author "Claude"
python3 scripts/office/validate.py unpacked
python3 scripts/office/pack.py unpacked report-v2.docx --validate true
```

### FAIL: 修订文档批量替换

```python
# 文档有 30 处 tracked changes
content = content.replace("OldName", "NewName")
# w:ins / w:del 元素被破坏 → 修订记录全乱
```

### PASS: 先 accept 再改

```bash
python3 scripts/accept_changes.py tracked.docx clean.docx
# 所有修订接受 → 普通文本 → 再批量替换
# 或：用 python-docx API 仅修改 paragraph.text，保留结构
```
