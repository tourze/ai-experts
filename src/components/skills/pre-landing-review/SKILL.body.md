## 工作流

确定性步骤交给 `scripts/`，判断保留 prose。三步流程见 [references/scripts-workflow.md](./references/scripts-workflow.md)：

1. `scripts/collect_diff.mjs` 锁定审查范围（输出 files/numstat/stat JSON）
2. **判断**（必须你做）：读 checklist + 实际 diff，给每个变更点定 severity / 阻断或建议 / 用户三选一
3. `scripts/render_report.mjs` 把 findings JSON 渲染成标准 markdown（阻断项 / 建议项 / 门禁结论）

详细字段、JSON schema 与命令示例见上述 references 文件，触发时再读取。

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
