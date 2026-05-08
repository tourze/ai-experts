# 文件格式支持

本文档提供 MarkItDown 支持的每种文件格式的详细信息。

## 文档格式

### PDF (.pdf)

**能力**：
- 文本提取
- 表格检测
- 元数据提取
- 扫描文档的 OCR（需依赖项）

**依赖项**：
```bash
pip install 'markitdown[pdf]'
```

**最适合**：
- 科学论文
- 报告
- 书籍
- 表单

**限制**：
- 复杂布局可能无法保留完美的格式
- 扫描的 PDF 需要 OCR 设置
- 某些 PDF 功能（注释、表单）可能无法转换

**示例**：
```python
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("research_paper.pdf")
print(result.text_content)
```

**配合 Azure 文档智能增强**：
```python
md = MarkItDown(docintel_endpoint="https://YOUR-ENDPOINT.cognitiveservices.azure.com/")
result = md.convert("complex_layout.pdf")
```

---

### Microsoft Word (.docx)

**能力**：
- 文本提取
- 表格转换
- 标题层级
- 列表格式
- 基本文本格式（粗体、斜体）

**依赖项**：
```bash
pip install 'markitdown[docx]'
```

**最适合**：
- 研究论文
- 报告
- 文档
- 手稿

**保留的元素**：
- 标题（转换为 Markdown 标题）
- 表格（转换为 Markdown 表格）
- 列表（无序和有序）
- 基本格式（粗体、斜体）
- 段落

**示例**：
```python
result = md.convert("manuscript.docx")
```

---

### PowerPoint (.pptx)

**能力**：
- 幻灯片内容提取
- 演讲者备注
- 表格提取
- 图片描述（带 AI）

**依赖项**：
```bash
pip install 'markitdown[pptx]'
```

**最适合**：
- 演示文稿
- 讲座幻灯片
- 会议演讲

**输出格式**：
```markdown
# 幻灯片 1：标题

来自幻灯片 1 的内容...

**备注**：演讲者注释放置在此处

---

# 幻灯片 2：下一个主题

...
```

**带 AI 图片描述**：
```python
from openai import OpenAI

client = OpenAI()
md = MarkItDown(llm_client=client, llm_model="gpt-4o")
result = md.convert("presentation.pptx")
```

---

### Excel (.xlsx, .xls)

**能力**：
- 工作表提取
- 表格格式化
- 数据保留
- 公式值（已计算）

**依赖项**：
```bash
pip install 'markitdown[xlsx]'  # 现代 Excel
pip install 'markitdown[xls]'   # 旧版 Excel
```

**最适合**：
- 数据表格
- 研究数据
- 统计结果
- 实验数据

**输出格式**：
```markdown
# 工作表：结果

| 样本 | 对照组 | 处理组 | P 值 |
|--------|---------|-----------|---------|
| 1      | 10.2    | 12.5      | 0.023   |
| 2      | 9.8     | 11.9      | 0.031   |
```

**示例**：
```python
result = md.convert("experimental_data.xlsx")
```

---

## 图片格式

### 图片 (.jpg, .jpeg, .png, .gif, .webp)

**能力**：
- EXIF 元数据提取
- OCR 文本提取
- AI 驱动的图片描述

**依赖项**：
```bash
pip install 'markitdown[all]'  # 包含图片支持
```

**最适合**：
- 扫描文档
- 图表和图形
- 科学图示
- 带文本的照片

**不含 AI 的输出**：
```markdown
![图片](image.jpg)

**EXIF 数据**：
- 相机：Canon EOS 5D
- 日期：2024-01-15
- 分辨率：4000x3000
```

**带 AI 的输出**：
```python
from openai import OpenAI

client = OpenAI()
md = MarkItDown(
    llm_client=client,
    llm_model="gpt-4o",
    llm_prompt="详细描述此科学图示"
)
result = md.convert("graph.png")
```

**文本提取 OCR**：
需要 Tesseract OCR：
```bash
# macOS
brew install tesseract

# Ubuntu
sudo apt-get install tesseract-ocr
```

---

## 音频格式

### 音频 (.wav, .mp3)

**能力**：
- 元数据提取
- 语音转文本转录
- 时长和技术信息

**依赖项**：
```bash
pip install 'markitdown[audio-transcription]'
```

**最适合**：
- 讲座录音
- 访谈
- 播客
- 会议录音

**输出格式**：
```markdown
# 音频：interview.mp3

**元数据**：
- 时长：45:32
- 比特率：320kbps
- 采样率：44100Hz

**转录**：
[转录文本在此处...]
```

**示例**：
```python
result = md.convert("lecture.mp3")
```

---

## Web 格式

### HTML (.html, .htm)

**能力**：
- 干净的 HTML 到 Markdown 转换
- 链接保留
- 表格转换
- 列表格式

**最适合**：
- 网页
- 文档
- 博客文章
- 在线文章

**输出格式**：保留链接和结构的干净 Markdown

**示例**：
```python
result = md.convert("webpage.html")
```

---

### YouTube URL

**能力**：
- 获取视频转录
- 提取视频元数据
- 字幕下载

**依赖项**：
```bash
pip install 'markitdown[youtube-transcription]'
```

**最适合**：
- 教育视频
- 讲座
- 演讲
- 教程

**示例**：
```python
result = md.convert("https://www.youtube.com/watch?v=VIDEO_ID")
```

---

## 数据格式

### CSV (.csv)

**能力**：
- 自动表格转换
- 分隔符检测
- 标题保留

**输出格式**：Markdown 表格

**示例**：
```python
result = md.convert("data.csv")
```

**输出**：
```markdown
| Column1 | Column2 | Column3 |
|---------|---------|---------|
| Value1  | Value2  | Value3  |
```

---

### JSON (.json)

**能力**：
- 结构化表示
- 漂亮格式化
- 嵌套数据可视化

**最适合**：
- API 响应
- 配置文件
- 数据导出

**示例**：
```python
result = md.convert("data.json")
```

---

### XML (.xml)

**能力**：
- 结构保留
- 属性提取
- 格式化输出

**最适合**：
- 配置文件
- 数据交换
- 结构化文档

**示例**：
```python
result = md.convert("config.xml")
```

---

## 存档格式

### ZIP (.zip)

**能力**：
- 遍历存档内容
- 逐个转换每个文件
- 在输出中保持目录结构

**最适合**：
- 文档集合
- 项目存档
- 批量转换

**输出格式**：
```markdown
# 存档：documents.zip

## 文件：document1.pdf
[来自 document1.pdf 的内容...]

---

## 文件：document2.docx
[来自 document2.docx 的内容...]
```

**示例**：
```python
result = md.convert("archive.zip")
```

---

## 电子书格式

### EPUB (.epub)

**能力**：
- 完整文本提取
- 章节结构
- 元数据提取

**最适合**：
- 电子书
- 数字出版物
- 长篇内容

**输出格式**：保留章节结构的 Markdown

**示例**：
```python
result = md.convert("book.epub")
```

---

## 其他格式

### Outlook 消息 (.msg)

**能力**：
- 邮件内容提取
- 附件列表
- 元数据（发件人、收件人、主题、日期）

**依赖项**：
```bash
pip install 'markitdown[outlook]'
```

**最适合**：
- 邮件存档
- 通信记录

**示例**：
```python
result = md.convert("message.msg")
```

---

## 特定格式技巧

### PDF 最佳实践

1. **对复杂布局使用 Azure 文档智能**：
   ```python
   md = MarkItDown(docintel_endpoint="endpoint_url")
   ```

2. **对于扫描的 PDF，确保 OCR 已设置**：
   ```bash
   brew install tesseract  # macOS
   ```

3. **转换前拆分非常大的 PDF**以获得更好的性能

### PowerPoint 最佳实践

1. **对视觉内容使用 AI**：
   ```python
   md = MarkItDown(llm_client=client, llm_model="gpt-4o")
   ```

2. **检查演讲者备注**——它们包含在输出中

3. **复杂动画不会被捕获**——仅静态内容

### Excel 最佳实践

1. **大型电子表格**可能需要时间来转换

2. **公式被转换为计算后的值**

3. **多个工作表**都包含在输出中

4. **图表变为文本描述**（使用 AI 获得更好的描述）

### 图片最佳实践

1. **使用 AI 获得有意义的描述**：
   ```python
   md = MarkItDown(
       llm_client=client,
       llm_model="gpt-4o",
       llm_prompt="详细描述此科学图形"
   )
   ```

2. **对于文本密集的图片，确保安装 OCR 依赖项**

3. **高分辨率图片**可能需要更长时间处理

### 音频最佳实践

1. **清晰的音频**产生更好的转录

2. **长录音**可能需要大量时间

3. **考虑拆分长的音频文件**以获得更快的处理速度

---

## 不支持的格式

如果您需要转换不支持的格式：

1. **创建自定义转换器**（参见 `api_reference.md`）
2. **在 GitHub 上查找插件**（#markitdown-plugin）
3. **预转换为支持的格式**（例如，将 .rtf 转换为 .docx）

---

## 格式检测

MarkItDown 通过以下方式自动检测格式：

1. **文件扩展名**（主要方法）
2. **MIME 类型**（后备）
3. **文件签名**（魔术字节，后备）

**覆盖检测**：
```python
# 强制指定格式
result = md.convert("file_without_extension", file_extension=".pdf")

# 使用流
with open("file", "rb") as f:
    result = md.convert_stream(f, file_extension=".pdf")
```
