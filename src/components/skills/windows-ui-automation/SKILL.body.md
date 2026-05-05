## 适用场景

- 需要使用 UIA / Win32 API 做窗口发现、元素定位、按钮点击、键盘输入和状态读取。
- 需要先定义权限分层、阻断名单、超时和审计字段，再实施自动化动作。
- 需要在 Windows 客体里复现自动化脚本或安全边界时，可联动 [prlctl-vm-control](../prlctl-vm-control/SKILL.md)。
- 需要更细的等待策略、审计字段和威胁场景时，继续读取 [进阶模式](./references/advanced-patterns.md)、[安全示例](./references/security-examples.md) 与 [威胁模型](./references/threat-model.md)。
- 如果问题其实属于驱动、回调或内核对象，不要继续堆 UIA 逻辑，转到 [windows-kernel-security](../windows-kernel-security/SKILL.md)。

## 核心约束

- 默认 `read-only`；只有在用户明确需要时才提升到可点击、可输入的交互级别。
- 必须校验目标进程、权限边界和阻断名单，禁止跨提权边界操作敏感窗口。
- 输入类动作必须带超时、速率限制和热键阻断；不要向安全对话框、密码管理器或系统工具注入输入。
- 自动化动作必须可审计：至少记录目标进程、操作类型、权限层级和相关窗口标识。
- UI 问题先从“能否只读观测”开始；只有观测不足时才进入输入或点击阶段。

## 代码模式

### 模式 1：目标校验与热键阻断

```python
from dataclasses import dataclass
from typing import Optional

BLOCKED_PROCESSES = {
    "1password.exe",
    "keepass.exe",
    "mmc.exe",
    "powershell.exe",
    "regedit.exe",
}
BLOCKED_HOTKEYS = {"ctrl+alt+delete", "win+r", "win+x"}


class UIAutomationPolicyError(RuntimeError):
    pass


@dataclass(frozen=True)
class AutomationTarget:
    process_name: str
    elevated: bool
    operation: str


def normalize_hotkey(keys: str) -> str:
    return keys.replace(" ", "").lower()


def validate_target(
    target: AutomationTarget,
    *,
    source_elevated: bool,
    hotkey: Optional[str] = None,
) -> None:
    process_name = target.process_name.lower()
    if process_name in BLOCKED_PROCESSES:
        raise UIAutomationPolicyError(f"禁止自动化敏感进程: {target.process_name}")
    if target.elevated and not source_elevated:
        raise UIAutomationPolicyError("禁止从非提权上下文控制高权限窗口")
    if hotkey and normalize_hotkey(hotkey) in BLOCKED_HOTKEYS:
        raise UIAutomationPolicyError(f"禁止注入敏感热键: {hotkey}")
```

### 模式 2：等待策略先建模，再调用 UIA

```python
from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class WaitPolicy:
    timeout_seconds: float = 10.0
    poll_interval_seconds: float = 0.2


def build_wait_schedule(policy: WaitPolicy) -> List[float]:
    attempts = max(1, int(policy.timeout_seconds / policy.poll_interval_seconds))
    return [
        round((index + 1) * policy.poll_interval_seconds, 2)
        for index in range(attempts)
    ]
```

## 检查清单

- 当前动作是否真的需要输入或点击，还是只读查询就能满足需求。
- 目标进程是否命中阻断名单，或者是否跨越了完整性级别 / 提权边界。
- 是否已经定义了超时、轮询间隔、失败回退与审计字段。
- 是否明确了元素定位策略：窗口标题、`AutomationId`、控件类型、可见性与焦点约束。
- 如需复现高风险场景，是否已经切换到虚拟机并保留快照。

## 反模式

### FAIL: 敏感窗口自动化

```python
send_keys(window="1password.exe", keys="master_password")
# 密码管理器 / 安全弹窗 / UAC / mmc.exe 一律禁止
```

### PASS: 阻断名单 + 校验

```python
BLOCKED = {"1password.exe", "keepass.exe", "mmc.exe", "regedit.exe"}
if target.process_name.lower() in BLOCKED:
    raise UIAutomationPolicyError("禁止自动化敏感进程")
```

### FAIL: UIA 失败降级到坐标

```python
try: click_element(auto_id="submit")
except: click(x=187, y=642)  # 暴力坐标
# 屏幕分辨率/DPI 变 → 点错
```

### PASS: 多种定位 + 失败报错

```python
# UIA 失败 → 尝试 AutomationId → Name → ControlType
# 都失败 → 报错 + 截图 + 审计日志
# 不回退到坐标
```
