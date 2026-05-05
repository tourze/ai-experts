# 会话终结工作流

从"代码写完"到"可交付状态"的结构化 checklist。两档模式：快速收尾走六步流程，深度复盘追加治理资产沉淀。

## 使用场景

- 功能实现、Bug 修复、重构完成后的收尾交付。
- 工作日结束前的会话清理。
- 任务闭合后需深度复盘沉淀长期规则。

## 何时不使用

- 任务仍在推进且非阶段性 handoff。
- 短会话（< 3 轮有效编码交互）只给简短收尾。
- 作为 subagent 被派遣（看到 `<SUBAGENT-STOP>` 即跳过）。

## 快速收尾：六步流程

### Step 1: 自检验证

- [ ] 所有改动文件已过 `git diff --cached` 审查
- [ ] 与本次改动直接相关的验证命令已执行并真实通过
- [ ] 无新增 lint/类型错误、无新增测试失败
- [ ] 改动范围内没有调试语句残留（console.log、print、debugger）
- [ ] 敏感信息检查（.env、密钥、凭据未进入 diff）

验证命令无法执行时必须说明原因，降低完成度表述。

### Step 2: 分支收尾

- [ ] `git status --short` 确认无遗漏文件
- [ ] 无关文件已排除（不属于本次改动的 hunk 不进提交）
- [ ] 分支名称与改动内容一致

### Step 3: 提交

- [ ] commit message 使用 Conventional Commits 格式
- [ ] commit message 描述"为什么"而非"做了什么"
- [ ] 跨关注点的改动拆成多个独立 commit
- [ ] `git diff --cached --stat` 确认提交范围正确

### Step 4: 会话记录

- [ ] 基于 git 证据（log/diff/status）采集事实，不凭记忆编造
- [ ] 按 [references/session-record.md](./references/session-record.md) 模板输出：完成工作、关键决策、遗留事项、变更文件
- [ ] 记录写入记忆文件，控制在 300 字以内
- [ ] 不评价工作质量，只记录事实和决策

### Step 5: 复盘

- [ ] 识别效率瓶颈（等待、方向调整、信息不足）
- [ ] 是否有可沉淀的规则？

### Step 6: 评审响应

- [ ] PR review 反馈逐条处理
- [ ] 合并冲突先解决再提交

## 深度复盘：治理资产沉淀

任务闭合（`✅ DONE` / `⚠️ DONE_WITH_CONCERNS`）或出现"早知道就……"信号时，追加治理分析。按 4 类长期资产分别判断：

| 资产类型 | 落点 | 判断标准 |
|---------|------|---------|
| MEMORY.md | `~/.claude/projects/<path>/memory/` | 跨会话仍成立的用户偏好/项目约束/反馈规则 |
| 可复用工作流 | plan / CLAUDE.md | 本次有效的执行序列可复用到同类任务 |
| Skill 优化 | `SKILL.md` frontmatter | description 触发词增删、红线补充、反模式补全 |
| Hooks 使用 | `~/.claude/settings.json` | hook 噪音、误拦、缺位 |

硬规则：
- 记忆用绝对日期；`feedback`/`project` 类带 **Why** 和 **How to apply**；不写当前 PR 状态、代码风格或 git 历史。
- Skill 建议给 `SKILL.md` 路径与 frontmatter `description` 的具体改法。
- Hook 建议注明事件、匹配条件和误判样本；禁止建议「全局始终注入」。
- 去重并量化：记忆 ≤ 5、工作流 ≤ 2、skill ≤ 3、hook ≤ 2；每条说明收益。

## 输出模板

```markdown
# 会话终结报告

## 完成项
[本次实际完成的任务]

## 改动文件
- `path/to/file`: 一行说明

## 验证结果
- 命令: `xxx` → 结果: ✅ 通过 / ⚠️ 未执行（原因）

## 关键决策
| 决策 | 理由 | 备选 |

## 未完成项与下次入口
[条目 → 文件:行号 → 阻塞原因]

## 治理资产建议（深度复盘时）
### MEMORY
[≤ 5 条，带 Why 和 How to apply]

### 工作流
[≤ 2 条]

### Skill
[≤ 3 条，含 SKILL.md 路径和具体改法]

### Hooks
[≤ 2 条，含事件和匹配条件]

## 不沉淀清单
[不具备长期价值的观察，说明不沉淀原因]
```

## 红线

- **禁止伪完成**：验证命令没跑就说"通过"、改动没看就说"没问题"。
- **禁止混合提交**：不相关的改动必须分开 commit。
- **禁止跳过审查**：`git diff --cached` 必须过一遍。
- **禁止 force push 到主分支**。
- **禁止伪造治理建议**：不读现有 MEMORY 就建议新增。
- 本 skill 默认不主动改 MEMORY.md / hooks / skill 文件；治理建议经用户确认后再落盘。
