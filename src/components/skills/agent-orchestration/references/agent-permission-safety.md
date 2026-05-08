# Agent Permission & Safety

## 适用场景

- 为 AI Agent 设计权限模型：信任谱系、权限模式、检查管道。
- 实现 fail-closed 原则：不确定时拒绝而非放行。
- 设计规则预分类 + AI 分类器的两阶段权限判断。
- 需要与 [agent-tool-design](./agent-tool-design.md) 联动做工具级权限声明。

## 核心约束

- **铁律：Fail-Closed**——不确定时默认 `ask` 或 `deny`，永远不能默认 `allow`。分类器异常 = deny。
- 权限是用户可调的**谱系**（spectrum），不是二元开关。用户控制信任级别，不是开发者硬编码。
- 每次工具调用必须过三阶段管道：输入校验 → 工具自检 → 外层引擎，详见 [references/permission-pipeline.md](./permission-pipeline.md)。
- 规则检查在 AI 分类之前——规则是 O(1) 确定性的，AI 推理是昂贵且概率性的。
- 必须存在 bypass-immune 操作——即使用户开启全自动模式，某些操作仍需人工确认。

## 实施步骤

### 步骤 1：定义权限模式谱系

设计 3-4 个权限级别，从保守到自主递进，详见 [references/permission-pipeline.md](./permission-pipeline.md)。

### 步骤 2：实现三阶段检查管道

按 validateInput → tool.checkPermissions → canUseTool 顺序串联。

### 步骤 3：配置规则层 + AI 分类器

规则层处理 80%+ 明确场景，AI 分类器只处理歧义场景，详见 [references/classification.md](./classification.md)。

## 代码模式

### FAIL: 全局 is_safe() 函数

```python
# ❌ 单点判断，不 scale，缺领域上下文
def is_safe(tool_name, input):
    dangerous = ["delete", "drop", "rm"]
    return not any(d in str(input) for d in dangerous)
```

→ 字符串匹配会误杀 `rm -rf build/`（合法构建清理），漏掉 `curl | bash`（真正危险）。

### PASS: 三阶段管道

```python
# ✅ 每层各司其职
result = validate_input(tool, input)          # Phase 1: 格式校验
if result.is_error: return reject(result)

result = tool.check_permissions(input, ctx)   # Phase 2: 工具领域判断
if result != PASSTHROUGH: return result

result = permission_engine.evaluate(tool, input, ctx)  # Phase 3: 规则 + AI
return result
```

→ 格式错误提前拒绝；领域逻辑由工具负责；外层做全局策略。

### FAIL: 分类器异常时放行

```python
except Exception:
    return ALLOW  # ❌ 异常处理变成绕过向量
```

### PASS: 分类器异常时拒绝

```python
except Exception:
    return DENY   # ✅ fail-closed，宁可多问一次也不放过风险
```

## 验证清单

- [ ] 默认模式是否 fail-closed（deny/ask）而非 fail-open？
- [ ] 每个工具是否实现了领域级 `check_permissions()`？
- [ ] 工具返回 `passthrough` 而非越界做外层决策？
- [ ] AI 分类前是否有规则预过滤？
- [ ] 分类器异常是否产生 `deny`？
- [ ] 是否有操作被标记为 bypass-immune？
- [ ] 权限决策是否有审计日志（工具名、输入、决策、来源）？
- [ ] 用户能否通过配置（非代码）调整权限级别？

## 反模式

- **默认允许 + 黑名单**：新工具自动获得 allow → fail-open，新增工具是安全漏洞。
- **二元 safe/unsafe**：丢失上下文（计划模式、信任级别、任务类型），灵活性为零。
- **每次调用都跑 AI 分类**：对 `ls` 也花 100-500ms 推理 → 延迟爆炸，无安全收益。
- **无审计日志**：出事后无法复盘 Agent 做了什么决策。
