## 分析流程

1. **模块地图**：列出目录/包边界、public interface 和职责声明；标注 ownership 模糊点。
2. **依赖图**：绘制 import/require/use 关系，识别循环依赖、越层调用和不必要耦合。
3. **架构合规**：对照声明的架构约束（MVC / Clean Architecture / Hexagonal / 分层），检测违规点。
4. **状态流**：追踪核心业务对象的生命周期——入口、处理、输出、错误路径、副作用和状态转移。
5. **变更热点**：用 git log 识别高 churn 文件、shotgun surgery 模式和长寿分支波及面。
6. **健康度评分**：按模块边界清晰度、依赖复杂度、分层合规率和变更热点密度给出 S1-S5 评级。
7. **修改指南**：为核心模块给出新增功能、改变行为、扩展接口的具体操作路径。

详细命令模板见 [references/code-patterns.md](references/code-patterns.md)。

## 反模式

### FAIL: 凭直觉画模块边界

```
用户：分析 src/ 的架构
AI：我觉得 src/utils 是工具层，src/components 是展示层，结构比较清晰...
```

不读取文件内容直接归类，模块边界全凭目录名猜测。没有文件级证据支撑。

### PASS: 文件级证据驱动的模块地图

```
AI：
| 模块 | 目录 | Public Interface | 依赖方向 |
|------|------|-----------------|---------|
| core | src/core/ | DataStore, AuthService | 只被 api 层依赖 |
| api | src/api/ | REST handlers | 依赖 core, 不依赖 ui |
| ui | src/ui/ | React components | 依赖 core, 不依赖 api |

证据：DataStore 定义在 src/core/store.ts:15，被 src/api/handlers.ts:8 和 src/ui/App.tsx:12 import。
```

更多反模式与检查清单见 [references/anti-patterns.md](references/anti-patterns.md)。

## 交叉引用

- [`architecture-reviewer`](../architecture-reviewer/SKILL.md)：架构设计评审，侧重设计质量而非结构事实取证
- `deep-code-read`：深度理解不熟悉代码库
- [`tech-debt`](../tech-debt/SKILL.md)：技术债识别、排序与治理
- [`software-design`](../software-design/SKILL.md)：设计原则与架构模式，从复杂度、深模块和信息隐藏角度评估设计
