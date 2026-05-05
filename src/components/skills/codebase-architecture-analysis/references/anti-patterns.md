# 反模式与检查清单

## 反模式

### FAIL: 循环依赖只报告不画图

```
发现 A → B → C → A 循环依赖。
```

不给出环路路径、不标注入口文件和行号，读者无法定位修复起点。

### PASS: 循环依赖带出入口与路径

```
## 循环依赖
A (src/a/index.ts:1) → B (src/b/util.ts:3) → C (src/c/helper.ts:7) → A (src/a/index.ts:15)
入口文件：src/a/index.ts
建议断开：C → A，将 A 被 C 使用的 getConfig() 下沉到 shared 层。
```

### FAIL: 把代码风格写成结构风险

```
❌ 风险：useSelector 应该用 selectUser 而非 state => state.user
```

代码风格问题不应混入结构健康度评分。

### PASS: 区分风格与结构

```
⚬ 风格（不影响结构健康度）：useSelector 回调可抽取为独立 selector 函数
🔴 结构风险：src/ui/UserProfile.tsx 直接 import src/db/connection.ts（UI 层直连数据层）
```

## 检查清单

- [ ] 模块地图是否覆盖所有顶层目录/包？
- [ ] 每个模块是否标注了 public interface 和允许的依赖方向？
- [ ] 循环依赖是否全部列出并标注入环路径？
- [ ] 越层调用是否逐条标注调用方、被调用方和违规层？
- [ ] 状态流是否覆盖核心业务对象的完整生命周期？
- [ ] 健康度评分是否有量化依据（churn 数据/依赖数/违规数）？
- [ ] 修改指南是否按「新增功能」「改变行为」「扩展接口」三类分列？
- [ ] 范围限制是否列出了未分析的模块/路径？
