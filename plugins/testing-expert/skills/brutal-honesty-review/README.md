# brutal-honesty-review

高强度技术审查技能的配套说明。

## 关键文件

- [SKILL.md](./SKILL.md)：模型执行说明
- [review-template.md](./resources/review-template.md)：结构化审查模板
- [assessment-rubrics.md](./resources/assessment-rubrics.md)：评分参考
- [assess-code.mjs](./scripts/assess-code.mjs)：代码侧快速巡检
- [assess-tests.mjs](./scripts/assess-tests.mjs)：测试侧快速巡检

## 使用方式

从目标项目根目录执行脚本，例如：

```bash
node /path/to/plugins/testing-expert/skills/brutal-honesty-review/scripts/assess-code.mjs src/
node /path/to/plugins/testing-expert/skills/brutal-honesty-review/scripts/assess-tests.mjs tests/
```

如果只是需要模型给出直接反馈，优先阅读 `SKILL.md`，不要把 README 当成执行规范。
