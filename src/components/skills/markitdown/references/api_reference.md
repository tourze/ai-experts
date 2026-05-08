# MarkItDown API 参考

## 核心类

### MarkItDown

将文件转换为 Markdown 的主要类。

```python
from markitdown import MarkItDown

md = MarkItDown(
    llm_client=None,
    llm_model=None,
    llm_prompt=None,
    docintel_endpoint=None,
    enable_plugins=False
)
```

#### 参数

| 参数 | 类型 | 默认值 | 描述 |
|-----------|------|---------|-------------|
| `llm_client` | OpenAI 客户端 | `None` | 用于 AI 图片描述的 OpenAI 兼容客户端 |
| `llm_model` | str | `None` | 用于图片描述的模型名称（例如 "anthropic/claude-opus-4.5"） |
| `llm_prompt` | str | `None` | 图片描述的自定义提示词 |
| `docintel_endpoint` | str | `None` | Azure 文档智能端点 |
| `enable_plugins` | bool | `False` | 启用第三方插件 |

#### 方法

##### convert()

将文件转换为 Markdown。

```python
result = md.convert(
    source,
    file_extension=None
)
```

**参数**：
- `source` (str)：要转换的文件路径
- `file_extension` (str, 可选)：覆盖文件扩展名检测

**返回**：`DocumentConverterResult` 对象

**示例**：
```python
result = md.convert("document.pdf")
print(result.text_content)
```

##### convert_stream()

从文件类二进制流进行转换。

```python
result = md.convert_stream(
    stream,
    file_extension
)
```

**参数**：
- `stream` (BinaryIO)：二进制文件类对象（例如以 `"rb"` 模式打开的文件）
- `file_extension` (str)：用于确定转换方法的文件扩展名（例如 ".pdf"）

**返回**：`DocumentConverterResult` 对象

**示例**：
```python
with open("document.pdf", "rb") as f:
    result = md.convert_stream(f, file_extension=".pdf")
    print(result.text_content)
```

**重要提示**：流必须以二进制模式（`"rb"`）打开，而非文本模式。

## 结果对象

### DocumentConverterResult

转换操作的结果。

#### 属性

| 属性 | 类型 | 描述 |
|-----------|------|-------------|
| `text_content` | str | 转换后的 Markdown 文本 |
| `title` | str | 文档标题（如有） |

#### 示例

```python
result = md.convert("paper.pdf")

# 访问内容
content = result.text_content

# 访问标题（如有）
title = result.title
```

## 自定义转换器

您可以通过实现 `DocumentConverter` 接口来创建自定义文档转换器。

### DocumentConverter 接口

```python
from markitdown import DocumentConverter

class CustomConverter(DocumentConverter):
    def convert(self, stream, file_extension):
        """
        从二进制流转换文档。
        
        参数：
            stream (BinaryIO)：二进制文件类对象
            file_extension (str)：文件扩展名（例如 ".custom"）
            
        返回：
            DocumentConverterResult：转换结果
        """
        # 在这里编写您的转换逻辑
        pass
```

### 注册自定义转换器

```python
from markitdown import MarkItDown, DocumentConverter, DocumentConverterResult

class MyCustomConverter(DocumentConverter):
    def convert(self, stream, file_extension):
        content = stream.read().decode('utf-8')
        markdown_text = f"# 自定义格式\n\n{content}"
        return DocumentConverterResult(
            text_content=markdown_text,
            title="自定义文档"
        )

# 创建 MarkItDown 实例
md = MarkItDown()

# 为 .custom 文件注册自定义转换器
md.register_converter(".custom", MyCustomConverter())

# 使用它
result = md.convert("myfile.custom")
```

## 插件系统

### 查找插件

在 GitHub 上搜索 `#markitdown-plugin` 标签。

### 使用插件

```python
from markitdown import MarkItDown

# 启用插件
md = MarkItDown(enable_plugins=True)
result = md.convert("document.pdf")
```

### 创建插件

插件是向 MarkItDown 注册转换器的 Python 包。

**插件结构**：
```
my-markitdown-plugin/
├── setup.py
├── my_plugin/
│   ├── __init__.py
│   └── converter.py
└── README.md
```

**setup.py**：
```python
from setuptools import setup

setup(
    name="markitdown-my-plugin",
    version="0.1.0",
    packages=["my_plugin"],
    entry_points={
        "markitdown.plugins": [
            "my_plugin = my_plugin.converter:MyConverter",
        ],
    },
)
```

**converter.py**：
```python
from markitdown import DocumentConverter, DocumentConverterResult

class MyConverter(DocumentConverter):
    def convert(self, stream, file_extension):
        # 您的转换逻辑
        content = stream.read()
        markdown = self.process(content)
        return DocumentConverterResult(
            text_content=markdown,
            title="我的文档"
        )
    
    def process(self, content):
        # 处理内容
        return "# 转换后的内容\n\n..."
```

## AI 增强转换

### 使用 OpenRouter 进行图片描述

```python
from markitdown import MarkItDown
from openai import OpenAI

# 初始化 OpenRouter 客户端（兼容 OpenAI API）
client = OpenAI(
    api_key="your-openrouter-api-key",
    base_url="https://openrouter.ai/api/v1"
)

# 创建带 AI 支持的 MarkItDown
md = MarkItDown(
    llm_client=client,
    llm_model="anthropic/claude-opus-4.5",  # 科学视觉推荐
    llm_prompt="详细描述此图片，用于科学文档"
)

# 转换带图片的文件
result = md.convert("presentation.pptx")
```

### 通过 OpenRouter 可用的模型

支持视觉功能的流行模型：
- `anthropic/claude-opus-4.5` - **科学视觉推荐**
- `google/gemini-3-pro-preview` - Gemini Pro Vision

参见 https://openrouter.ai/models 获取完整列表。

### 自定义提示词

```python
# 用于科学图表
scientific_prompt = """
分析此科学图表或图形。描述：
1. 可视化类型（图表、图形、图示等）
2. 关键数据点或趋势
3. 标签和坐标轴
4. 科学意义
请精确且专业。
"""

md = MarkItDown(
    llm_client=client,
    llm_model="anthropic/claude-opus-4.5",
    llm_prompt=scientific_prompt
)
```

## Azure 文档智能

### 设置

1. 创建 Azure 文档智能资源
2. 获取端点 URL
3. 设置认证

### 用法

```python
from markitdown import MarkItDown

md = MarkItDown(
    docintel_endpoint="https://YOUR-RESOURCE.cognitiveservices.azure.com/"
)

result = md.convert("complex_document.pdf")
```

### 认证

设置环境变量：
```bash
export AZURE_DOCUMENT_INTELLIGENCE_KEY="your-key"
```

或以编程方式传递凭证。

## 错误处理

```python
from markitdown import MarkItDown

md = MarkItDown()

try:
    result = md.convert("document.pdf")
    print(result.text_content)
except FileNotFoundError:
    print("文件未找到")
except ValueError as e:
    print(f"无效的文件格式：{e}")
except Exception as e:
    print(f"转换错误：{e}")
```

## 性能技巧

### 1. 复用 MarkItDown 实例

```python
# 好：创建一次，多次使用
md = MarkItDown()

for file in files:
    result = md.convert(file)
    process(result)
```

### 2. 对大文件使用流式转换

```python
# 对于大文件
with open("large_file.pdf", "rb") as f:
    result = md.convert_stream(f, file_extension=".pdf")
```

### 3. 批量处理

```python
from concurrent.futures import ThreadPoolExecutor

md = MarkItDown()

def convert_file(filepath):
    return md.convert(filepath)

with ThreadPoolExecutor(max_workers=4) as executor:
    results = executor.map(convert_file, file_list)
```

## 破坏性变更（v0.0.1 到 v0.1.0）

1. **依赖项**：现在组织为可选功能组
   ```bash
   # 旧
   pip install markitdown
   
   # 新
   pip install 'markitdown[all]'
   ```

2. **convert_stream()**：现在需要二进制文件类对象
   ```python
   # 旧（也接受文本）
   with open("file.pdf", "r") as f:  # 文本模式
       result = md.convert_stream(f)
   
   # 新（仅二进制）
   with open("file.pdf", "rb") as f:  # 二进制模式
       result = md.convert_stream(f, file_extension=".pdf")
   ```

3. **DocumentConverter 接口**：改为从流而非文件路径读取
   - 不创建临时文件
   - 内存效率更高
   - 插件需要更新

## 版本兼容性

- **Python**：需要 3.10 或更高版本
- **依赖项**：查看 `setup.py` 了解版本约束
- **OpenAI**：兼容 OpenAI Python SDK v1.0+

## 环境变量

| 变量 | 描述 | 示例 |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API 密钥，用于图片描述 | `sk-or-v1-...` |
| `AZURE_DOCUMENT_INTELLIGENCE_KEY` | Azure 文档智能认证 | `key123...` |
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` | Azure 文档智能端点 | `https://...` |
