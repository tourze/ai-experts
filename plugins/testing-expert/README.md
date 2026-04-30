# testing-expert

测试专家能力，覆盖 TDD 工作流、测试策略设计、预落地审查、Web 应用测试、测试用例头脑风暴和基准测试设计。

## Skills

| Skill | 用途 |
|-------|------|
| `test-driven-development` | TDD 工作流（Red-Green-Refactor） |
| `testing-strategy` | 常规测试计划设计与分层建议 |
| `test-brainstorm` | Bug 发现后测试用例头脑风暴 |
| `six-thinking-hats` | 六顶思考帽多维测试方法论 |
| `pre-landing-review` | 代码变更落地前安全审计 |
| `webapp-testing` | Playwright Web 应用交互测试 |
| `benchmark-runner` | 算法/模型/实现基准测试设计 |
| `brutal-honesty-review` | 无糖衣代码/测试质量审查 |
| `test-quality-review` | 当用户要审查已有测试代码的质量、诊断测试套件衰退风险或回答'这些测试写得怎么样'时使用。 |
| `verification-loop` | 当需要设计自动化验证循环、确保 agent 在所有检查通过后才能退出、或防止 agent 过早声称完成时使用。 |

## Agents

| Agent | 用途 |
|-------|------|
| `test-generator` | 基于现有源码生成测试：识别行为、推导用例并产出生产级测试文件 |
| `test-quality-reviewer` | 既有测试套件只读质量审查：脆弱测试、过度 mock、断言无效、间歇失败定位 |

## 校验

```bash
node --check skills/brutal-honesty-review/scripts/assess-code.mjs
node --check skills/brutal-honesty-review/scripts/assess-tests.mjs
```

## 安装 / 卸载

由仓库根目录的 `node scripts/install.mjs` 统一管理（symlink skills/agents + 注入用户级 hooks）。详见仓库 README 的「快速开始」段。

