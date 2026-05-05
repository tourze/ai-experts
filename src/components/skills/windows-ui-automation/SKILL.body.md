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
