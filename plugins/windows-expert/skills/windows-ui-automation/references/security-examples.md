# Windows UI Automation 安全示例

## 典型风险

- 跨提权边界自动化高权限窗口。
- 向安全对话框、系统工具或密码管理器发送输入。
- 通过 UIA 读取敏感字段、截图或剪贴板内容。
- 没有速率限制和超时控制，导致失控脚本持续注入输入。

## 最小化阻断示例

```python
BLOCKED_WINDOW_CLASSES = {"#32770", "Credential Dialog", "Windows Security"}
SENSITIVE_KEYWORDS = {"credential", "password", "secret", "token"}


def is_sensitive_window(window_class: str) -> bool:
    return window_class in BLOCKED_WINDOW_CLASSES


def redact_value(element_name: str, value: str) -> str:
    normalized = element_name.lower()
    if any(keyword in normalized for keyword in SENSITIVE_KEYWORDS):
        return "[REDACTED]"
    return value
```

## 使用提示

- 任何输入注入前都先做窗口类别检查与权限边界检查。
- 截图、OCR、剪贴板读取默认视为敏感动作，必须先定义脱敏策略。
- 一旦发现需要与 UAC、安全对话框或管理工具交互，应立即停止自动化并请求人工确认。
