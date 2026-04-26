# testing-expert

测试专家插件，覆盖 TDD 工作流、测试策略设计、预落地审查、Web 应用测试、测试用例头脑风暴和基准测试设计。

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

## 结构

```text
testing-expert/
├── hooks/
│   ├── hooks.json
│   └── dispatch.mjs
└── skills/
```

## Agents

| Agent | 用途 |
|-------|------|
| `test-generator` | 基于现有源码生成测试：识别行为、推导用例并产出生产级测试文件 |

## 校验

```bash
node --check hooks/dispatch.mjs
node --check skills/brutal-honesty-review/scripts/assess-code.mjs
node --check skills/brutal-honesty-review/scripts/assess-tests.mjs
```

## 安装

```bash
claude --plugin-dir /path/to/plugins/testing-expert
```

如果要通过本仓库根目录注册的 `ai-experts` marketplace 持久安装：

```bash
claude plugin install testing-expert@ai-experts
claude plugin install testing-expert@ai-experts --scope project
```

## 卸载

```bash
claude plugin uninstall testing-expert
claude plugin uninstall testing-expert --scope project
```

如果只是通过 `claude --plugin-dir ...` 临时加载，则不需要执行卸载；结束当前会话或下次启动时去掉 `--plugin-dir` 即可。
