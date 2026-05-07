## 代码模式

### 1. 查看帮助

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

### 2. 单文件压缩

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

### 3. 保留原图

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

### 4. 目录批处理

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

输出字段与行为要点：

- `input`：原文件绝对路径。
- `output`：压缩后的目标路径。
- `ratio`：`outputSize / inputSize`。
- 批处理模式下，如果所有文件都失败，脚本会直接报错而不是输出空摘要。
