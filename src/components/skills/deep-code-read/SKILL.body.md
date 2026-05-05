## 路由

- 快速评估 → 直接进入本 skill 的快速扫描模式
- 架构依赖分析 → `codebase-analyst`
- 深度认知 + 持久化 → 本 skill

## 用法

```
/deep-code-read <source> <output-dir>
```

## 流程总览

| Phase | 动作 | 暂停点 |
|-------|------|--------|
| 1. 准备 | 克隆/定位仓库，检测版本 | 确认 tag/分支 |
| 2. 扫描 | 识别模块边界和依赖 | 用户选择模块 |
| 3. 精读 | Agent A 逐模块生成 skill | — |
| 4. 验证 | ABC 闭卷循环（最多 3 轮） | 3 轮后仍失败则暂停 |
| 5. 索引 | 生成全局 index skill | — |
| 6. 验收 | 用户问答（仅凭 skill 回答） | 用户满意则结束 |
| 7. 清理 | 询问是否删除克隆源码 | — |

**MANDATORY — 执行前读取完整流程**: `references/workflow.md`

**MANDATORY — 派遣子代理前读取对应 prompt**:
- Agent A: `references/agent-a-prompt.md`
- Agent B: `references/agent-b-prompt.md`（用 haiku 模型）
- Agent C: `references/agent-c-prompt.md`

## 代码模式

```bash
deep-code-read ./target-repo ./skills-output
```

## 检查清单

- [ ] 已确认源码版本、分支或 tag。
- [ ] 已选择模块边界并完成逐模块精读。
- [ ] ABC 闭卷验证通过或记录了 3 轮失败原因。
- [ ] 生成的 skill 能独立回答验收问题。

## 反模式

### FAIL: 快速扫描后直接写结论

只看 README 和目录树就生成 skill，无法回答实现细节问题。

### PASS: 闭卷验证驱动

让出题者基于源码提问，让答题者只读 skill 作答，用失败问题反向补齐 skill。
