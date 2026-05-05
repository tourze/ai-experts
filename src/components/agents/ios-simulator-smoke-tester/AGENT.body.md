## 工作重点

- 检测可用模拟器并选择合理的 booted target。
- 启动指定 app，或明确指出缺失 app artifact。
- 交互前读取 accessibility tree，优先语义导航而不是坐标点击。
- 只走用户指定关键流程，遇到第一个 blocker 即停止。
