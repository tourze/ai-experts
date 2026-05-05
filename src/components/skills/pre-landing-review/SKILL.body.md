## 工作流

确定性步骤交给 `scripts/`，判断保留 prose。三步流程见 [references/scripts-workflow.md](./references/scripts-workflow.md)：

1. `scripts/collect_diff.mjs` 锁定审查范围（输出 files/numstat/stat JSON）
2. **判断**（必须你做）：读 checklist + 实际 diff，给每个变更点定 severity / 阻断或建议 / 用户三选一
3. `scripts/render_report.mjs` 把 findings JSON 渲染成标准 markdown（阻断项 / 建议项 / 门禁结论）

详细字段、JSON schema 与命令示例见上述 references 文件，触发时再读取。

## 检查清单

- [ ] 已读取实际 diff 与检查清单
- [ ] 阻断项和建议项已分开
- [ ] 每个阻断项都给出文件位置与具体风险
- [ ] 已提示用户三选一处理方式
- [ ] 结论明确为 `CLEAR TO LAND` 或 `BLOCKED`
- [ ] 没把普通代码风格问题误报成阻断项

## 纪律守卫

### Iron Law

```
没有读取实际 DIFF 和跑验证命令，不允许声称”可以落地”
```

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| “改动很小，应该没问题” | 小改动也能打穿安全边界。看 diff。 |
| “测试通过了，可以落” | 测试覆盖了这次改动的路径吗？哪些路径没覆盖？ |
| “作者说没问题” | 你在做独立审查，不是在确认作者的判断。 |
| “时间不够了，快速过一遍” | 草率审查比不审查更危险——给人虚假的安全感。 |

**执行前必须读取** [references/discipline-guard.md](./references/discipline-guard.md)——包含完整 Red Flags 表和 Rationalizations 对照表。跳过 = 违反 Iron Law。

## 反模式

### FAIL: 不看 diff 泛泛

```
“建议加强测试覆盖率 / 注意安全 / 优化性能”
→ 与本次 PR 无关 / 没有阻断项 / 没有可执行动作
```

### PASS: 基于 diff 的具体阻断

```bash
git diff --name-only origin/main...
# 仅审查变更文件
```
```md
## 阻断项（必须解决才能合并）
1. [P0] src/payment/service.ts:88
   问题：事务内调外部支付 API
   风险：高并发锁等待 → 重试风暴
   选项：[立即修复] [确认风险并加监控] [误报]
```

### FAIL: 命名当阻断

```
[阻断项] 变量 `data` 命名不清，建议改 `userOrders`
→ 风格问题不应阻断合并
```

### PASS: 风险分级

```
阻断项：数据丢失 / 安全漏洞 / 已知崩溃
建议项：可读性 / 命名 / 注释 / 风格
→ 阻断只用于真风险，不浪费团队 ICU 资源
```
