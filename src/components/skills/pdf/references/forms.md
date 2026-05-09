**重要：你必须按顺序完成这些步骤。不要跳到编写代码。**

如果你需要填写 PDF 表单，首先检查 PDF 是否有可填写的表单字段。在此文件所在目录运行以下脚本：
 `node scripts/check_fillable_fields.mjs '<file.pdf>'`，根据结果进入"可填字段"或"不可填字段"部分，并按照说明操作。

基于 Node 的 PDF 辅助工具需要 `pdf-lib`、`pdfjs-dist`、`@pdfme/converter` 和 `sharp` 可由 Node.js 解析；如果脚本报告缺少模块，使用 `npm install -g pdf-lib pdfjs-dist @pdfme/converter sharp` 安装它们。

# 可填字段
如果 PDF 有可填写的表单字段：
- 在此文件所在目录运行此脚本：`node scripts/extract_form_field_info.mjs '<input.pdf>' '<field_info.json>'`。它将创建一个包含字段列表的 JSON 文件，格式如下：
```
[
  {
    "field_id": （字段的唯一 ID），
    "page": （页码，从 1 开始），
    "rect": （[左, 下, 右, 上] 边界框，使用 PDF 坐标，y=0 是页面底部），
    "type": （"text"、"checkbox"、"radio_group" 或 "choice"），
  },
  // 复选框具有 "checked_value" 和 "unchecked_value" 属性：
  {
    "field_id": （字段的唯一 ID），
    "page": （页码，从 1 开始），
    "type": "checkbox",
    "checked_value": （将字段设置为此值以勾选复选框），
    "unchecked_value": （将字段设置为此值以取消勾选复选框），
  },
  // 单选按钮组具有包含可选选项的 "radio_options" 列表。
  {
    "field_id": （字段的唯一 ID），
    "page": （页码，从 1 开始），
    "type": "radio_group",
    "radio_options": [
      {
        "value": （将字段设置为此值以选择此单选选项），
        "rect": （此选项的单选按钮边界框）
      },
      // 其他单选选项
    ]
  },
  // 多选字段具有包含可选选项的 "choice_options" 列表：
  {
    "field_id": （字段的唯一 ID），
    "page": （页码，从 1 开始），
    "type": "choice",
    "choice_options": [
      {
        "value": （将字段设置为此值以选择此选项），
        "text": （选项的显示文本）
      },
      // 其他选择选项
    ],
  }
]
```
- 使用此脚本将 PDF 转换为 PNG（每页一张图片）（在此文件所在目录运行）：
`node scripts/convert_pdf_to_images.mjs '<file.pdf>' '<output_directory>'`
然后分析图片以确定每个表单字段的用途（确保将边界框 PDF 坐标转换为图片坐标）。
- 创建 `field_values.json` 文件，格式如下，包含要填入每个字段的值：
```
[
  {
    "field_id": "last_name", // 必须与 `extract_form_field_info.mjs` 中的 field_id 匹配
    "description": "用户的姓氏",
    "page": 1, // 必须与 field_info.json 中的 "page" 值匹配
    "value": "张三"
  },
  {
    "field_id": "Checkbox12",
    "description": "如果用户年满 18 岁则勾选的复选框",
    "page": 1,
    "value": "/On" // 如果是复选框，使用其 "checked_value" 值来勾选。如果是单选按钮组，使用 "radio_options" 中的 "value" 值之一。
  },
  // 更多字段
]
```
- 在此文件所在目录运行 `fill_fillable_fields.mjs` 脚本以创建已填写的 PDF：
`node scripts/fill_fillable_fields.mjs '<input.pdf>' '<field_values.json>' '<output.pdf>'`
此脚本将验证你提供的字段 ID 和值是否有效；如果打印了错误信息，请更正相应字段后重试。

# 不可填字段
如果 PDF 没有可填写的表单字段，你需要添加文本注释。首先尝试从 PDF 结构中提取坐标（更准确），然后在需要时回退到视觉估算。

## 步骤 1：先尝试结构提取

运行此脚本以提取文本标签、线条和复选框及其精确的 PDF 坐标：
`node scripts/extract_form_structure.mjs '<input.pdf>' form_structure.json`

这将创建一个包含以下内容的 JSON 文件：
- **labels**：每个文本元素的精确坐标（x0, top, x1, bottom，以 PDF 点为单位）
- **lines**：定义行边界的水平线
- **checkboxes**：作为复选框的小正方形矩形（含中心坐标）
- **row_boundaries**：根据水平线计算出的行顶部/底部位置

**检查结果**：如果 `form_structure.json` 包含有意义的标签（对应表单字段的文本元素），使用**方法 A：基于结构的坐标**。如果 PDF 是扫描/基于图片的且标签很少或没有，使用**方法 B：视觉估算**。

---

## 方法 A：基于结构的坐标（推荐）

当 `extract_form_structure.mjs` 在 PDF 中找到文本标签时使用此方法。

### A.1：分析结构

读取 form_structure.json 并识别：

1. **标签组**：相邻的文本元素构成单个标签（例如，"姓" + "名"）
2. **行结构**：具有类似 `top` 值的标签在同一行
3. **字段列**：输入区域在标签结束后开始（x0 = label.x1 + 间距）
4. **复选框**：直接使用结构中的复选框坐标

**坐标系**：PDF 坐标中 y=0 在页面顶部，y 向下增加。

### A.2：检查缺失元素

结构提取可能无法检测到所有表单元素。常见情况：
- **圆形复选框**：仅检测方形矩形作为复选框
- **复杂图形**：装饰性元素或非标准表单控件
- **褪色或浅色元素**：可能无法提取

如果你在 PDF 图片中看到 form_structure.json 中没有的表单字段，你需要对这些特定字段使用**视觉分析**（参见下面的"混合方法"）。

### A.3：使用 PDF 坐标创建 fields.json

对于每个字段，从提取的结构计算输入坐标：

**文本字段：**
- entry x0 = label x1 + 5（标签后的小间距）
- entry x1 = 下一个标签的 x0，或行边界
- entry top = 与标签 top 相同
- entry bottom = 下方的行边界线，或 label bottom + row_height

**复选框：**
- 直接使用 form_structure.json 中的复选框矩形坐标
- entry_bounding_box = [checkbox.x0, checkbox.top, checkbox.x1, checkbox.bottom]

使用 `pdf_width` 和 `pdf_height` 创建 fields.json（表示 PDF 坐标）：
```json
{
  "pages": [
    {"page_number": 1, "pdf_width": 612, "pdf_height": 792}
  ],
  "form_fields": [
    {
      "page_number": 1,
      "description": "姓氏输入字段",
      "field_label": "姓氏",
      "label_bounding_box": [43, 63, 87, 73],
      "entry_bounding_box": [92, 63, 260, 79],
      "entry_text": {"text": "张三", "font_size": 10}
    },
    {
      "page_number": 1,
      "description": "美国公民是复选框",
      "field_label": "是",
      "label_bounding_box": [260, 200, 280, 210],
      "entry_bounding_box": [285, 197, 292, 205],
      "entry_text": {"text": "X"}
    }
  ]
}
```

**重要**：使用直接从 form_structure.json 获取的 `pdf_width`/`pdf_height` 和坐标。

### A.4：验证边界框

在填写前，检查你的边界框是否有错误：
`node scripts/check_bounding_boxes.mjs fields.json`

这会检查相交的边界框和对于字体大小来说太小的输入框。在填写之前修复任何报告的错误。

---

## 方法 B：视觉估算（后备）

当 PDF 是扫描/基于图片的，且结构提取未找到可用的文本标签时（例如，所有文本显示为 "(cid:X)" 模式）使用此方法。

### B.1：将 PDF 转换为图片

`node scripts/convert_pdf_to_images.mjs '<input.pdf>' '<images_dir/>'`

### B.2：初始字段识别

检查每页图片以识别表单区域并获取字段位置的**粗略估算**：
- 表单字段标签及其大致位置
- 输入区域（用于文本输入的线条、方框或空白区域）
- 复选框及其大致位置

对于每个字段，记录大致的像素坐标（暂时不需要精确）。

### B.3：缩放精炼（对精度至关重要）

对于每个字段，裁剪估计位置周围的区域以精确地精炼坐标。

**使用 ImageMagick 创建缩放裁剪：**
```bash
magick <page_image> -crop <width>x<height>+<x>+<y> +repage <crop_output.png>
```

其中：
- `<x>, <y>` = 裁剪区域的左上角（使用你的粗略估算减去内边距）
- `<width>, <height>` = 裁剪区域的大小（字段区域加上每侧约 50px 的内边距）

**示例：** 要精炼估算在 (100, 150) 的"姓名"字段：
```bash
magick images_dir/page_1.png -crop 300x80+50+120 +repage crops/name_field.png
```

（注意：如果 `magick` 命令不可用，尝试使用相同参数的 `convert`。）

**检查裁剪后的图片**以确定精确坐标：
1. 识别输入区域开始的精确像素（标签之后）
2. 识别输入区域结束的像素（下一个字段或边缘之前）
3. 识别输入行/框的顶部和底部

**将裁剪坐标转换回完整图片坐标：**
- full_x = crop_x + crop_offset_x
- full_y = crop_y + crop_offset_y

示例：如果裁剪从 (50, 120) 开始，且输入框在裁剪内从 (52, 18) 开始：
- entry_x0 = 52 + 50 = 102
- entry_top = 18 + 120 = 138

**对每个字段重复此过程**，尽可能将附近字段分组到单个裁剪中。

### B.4：使用精炼坐标创建 fields.json

使用 `image_width` 和 `image_height` 创建 fields.json（表示图片坐标）：
```json
{
  "pages": [
    {"page_number": 1, "image_width": 1700, "image_height": 2200}
  ],
  "form_fields": [
    {
      "page_number": 1,
      "description": "姓氏输入字段",
      "field_label": "姓氏",
      "label_bounding_box": [120, 175, 242, 198],
      "entry_bounding_box": [255, 175, 720, 218],
      "entry_text": {"text": "张三", "font_size": 10}
    }
  ]
}
```

**重要**：使用 `image_width`/`image_height` 和来自缩放分析的精确像素坐标。

### B.5：验证边界框

在填写前，检查你的边界框是否有错误：
`node scripts/check_bounding_boxes.mjs fields.json`

这会检查相交的边界框和对于字体大小来说太小的输入框。在填写之前修复任何报告的错误。

---

## 混合方法：结构 + 视觉

当结构提取对大多数字段有效但遗漏了某些元素时（例如，圆形复选框、不常见的表单控件）使用此方法。

1. 对 form_structure.json 中检测到的字段使用**方法 A**
2. **将 PDF 转换为图片**以对缺失字段进行视觉分析
3. 对缺失字段使用**缩放精炼**（来自方法 B）
4. **合并坐标**：对于来自结构提取的字段，使用 `pdf_width`/`pdf_height`。对于视觉估算的字段，你必须将图片坐标转换为 PDF 坐标：
   - pdf_x = image_x * (pdf_width / image_width)
   - pdf_y = image_y * (pdf_height / image_height)
5. 在 fields.json 中使用**单一坐标系**—将所有内容转换为带 `pdf_width`/`pdf_height` 的 PDF 坐标

---

## 步骤 2：填写前验证

**始终在填写前验证边界框：**
`node scripts/check_bounding_boxes.mjs fields.json`

检查的内容包括：
- 相交的边界框（会导致文本重叠）
- 对于指定字体大小来说太小的输入框

在继续之前修复 fields.json 中任何报告的错误。

## 步骤 3：填写表单

填写脚本自动检测坐标系并处理转换：
`node scripts/fill_pdf_form_with_annotations.mjs '<input.pdf>' fields.json '<output.pdf>'`

## 步骤 4：验证输出

将填写的 PDF 转换为图片并验证文本位置：
`node scripts/convert_pdf_to_images.mjs '<output.pdf>' '<verify_images/>'`

如果文本位置不正确：
- **方法 A**：检查你是否使用了来自 form_structure.json 的 PDF 坐标，带 `pdf_width`/`pdf_height`
- **方法 B**：检查图片尺寸是否匹配，坐标是否为精确像素
- **混合方法**：确保视觉估算字段的坐标转换正确
