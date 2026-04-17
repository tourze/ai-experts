---
name: pdf-extraction
description: 当用户要从 PDF 中抽取文本、表格、页级结构或元数据时使用；不负责表单填写或版式回写。
---

# PDF 抽取

## 适用场景

- 用户要从 PDF 中提取正文、表格、页码、元数据或局部区域内容。
- 目标是为后续分析、结构化清洗或知识库沉淀准备原始数据。
- 需要使用 `pdfplumber` 这类工具做文本与表格级抽取。
- 如果还要做表单填写或图片标注，可转给 [pdf](../pdf/SKILL.md)。

## 核心约束

- 先判断 PDF 是文本型还是扫描型；扫描件需要 OCR 补链路。
- 提取结果必须保留页码、表格来源和关键字段位置，方便回溯。
- 表格抽取失败时，要明确指出版式原因，不要静默丢列。
- 这个技能只做“抽”，不做 PDF 回写。

## 代码模式

```python
import pdfplumber

with pdfplumber.open("report.pdf") as pdf:
    first_page = pdf.pages[0]
    print(first_page.extract_text())
    print(first_page.extract_tables())
```

如果后续要继续处理表单或坐标，请切换到 [pdf](../pdf/SKILL.md)。

## 检查清单

- 是否确认了 PDF 类型、语言和抽取目标字段。
- 是否在输出里保留页码、表格顺序和必要的坐标信息。
- 是否对长表格、跨页表格和多栏排版做了人工抽样检查。
- 是否把“抽取失败的页”明确记录，而不是默默跳过。
- 是否在需要进一步填表、批注或渲染时切换到 [pdf](../pdf/SKILL.md)。

## 反模式

### FAIL: 扫描件当文本型

```python
with pdfplumber.open("scanned.pdf") as pdf:
    text = pdf.pages[0].extract_text()
print(text)  # ""（空）
# 不知道是文件坏了还是需要 OCR
```

### PASS: 先识别类型

```python
def is_text_pdf(path):
    with pdfplumber.open(path) as pdf:
        return any(p.extract_text() for p in pdf.pages[:3])

if is_text_pdf("doc.pdf"):
    text_pages = extract_pages("doc.pdf")
    print(text_pages[0]["text"])
else:
    ocr_pdf = run_ocr_pipeline("doc.pdf")
    text_pages = extract_pages(ocr_pdf)
    print(text_pages[0]["text"])
```

### FAIL: 丢页码信息

```python
all_text = "\n".join(p.extract_text() for p in pdf.pages)
# 后续："这段话出自哪一页？" → 答不上
```

### PASS: 保留页码 + 结构

```python
result = []
for i, page in enumerate(pdf.pages, 1):
    result.append({
        "page": i,
        "text": page.extract_text(),
        "tables": [{"rows": t} for t in page.extract_tables()]
    })
# 每段都可回溯
```
