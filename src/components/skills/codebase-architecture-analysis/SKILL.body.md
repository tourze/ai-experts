## 分析流程

1. **模块地图**：列出目录/包边界、public interface 和职责声明；标注 ownership 模糊点。
2. **依赖图**：绘制 import/require/use 关系，识别循环依赖、越层调用和不必要耦合。
3. **架构合规**：对照声明的架构约束（MVC / Clean Architecture / Hexagonal / 分层），检测违规点。
4. **状态流**：追踪核心业务对象的生命周期——入口、处理、输出、错误路径、副作用和状态转移。
5. **变更热点**：用 git log 识别高 churn 文件、shotgun surgery 模式和长寿分支波及面。
6. **健康度评分**：按模块边界清晰度、依赖复杂度、分层合规率和变更热点密度给出 S1-S5 评级。
7. **修改指南**：为核心模块给出新增功能、改变行为、扩展接口的具体操作路径。

详细命令模板见 [references/code-patterns.md](references/code-patterns.md)。

## 交叉引用

- `deep-code-read`：深度理解不熟悉代码库
